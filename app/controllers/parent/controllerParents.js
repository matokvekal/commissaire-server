import BaseController from "../kid/baseController.js";
import { getFixedValue } from "../../utils/getFixedValues.js";
import config from "../../config/index.js";
import { QueryTypes } from "sequelize";
import checkType from "../../utils/checkType.js";
import { allowedFields } from "../../constants/serverConstants.js";

async function isKidInSameFamily(sequelize, parent_id, kidId) {
  const SQL = `
      SELECT EXISTS (
          SELECT 1
          FROM users AS parent
          JOIN users AS kid ON parent.family_id = kid.family_id
          WHERE parent.id = :parent_id
          AND parent.is_active = 1
          AND parent.is_register = 1
          AND parent.user_type = 'parent'
          AND kid.id = :kidId
          AND kid.is_active = 1
          AND kid.is_register = 1
          AND kid.user_type = 'kid'
      ) AS family_check;
  `;
  const familyCheck = await sequelize.query(SQL, {
    replacements: { parent_id, kidId },
    type: QueryTypes.SELECT,
  });
  return familyCheck[0].family_check;
}
class ControllerParents extends BaseController {
  constructor(app, modelName, sequelize) {
    super(app, modelName, sequelize);
  }

  //POST api/parent/token
  //her the client will send the server the firebase token for push notificatin
  googleToken = async (req, res) => {
    try {
      const parent_id = req.user.userId;
      const token = req.body.token;
      if (!parent_id || !token) {
        return res.status(400).send("some data is missing");
      }
      const SQL =
        "update users set firebase_notification_token = :token where id = :parent_id";
      await this.sequelize.query(SQL, {
        replacements: { token, parent_id },
        type: QueryTypes.UPDATE,
      });
      return res.status(200).send("Token saved successfully");
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in saving token.",
      });
    }
  };

  //GET api/parent/kids
  //kp-48
  getKids = async (req, res) => {
    console.log("getKids");
    try {
      const parent_id = req.user.userId;
      if (!parent_id) {
        return res.status(400).send("some data is missing");
      }

      const SQL =
        "select id,f_name,l_name from users where family_id like(select distinct family_id from users where id=:parent_id and is_active=1 and is_register=1 and user_type='parent') and is_register=1 and is_active=1 and user_type='kid'";
      const kids = await this.sequelize.query(SQL, {
        replacements: { parent_id },
        type: QueryTypes.SELECT,
      });
      return res.status(200).send({ kids });
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in getting kids.",
      });
    }
  };

  //GET api/parent/limits/:kidId
  //kp-49
  getLimits = async (req, res) => {
    console.log("getLimits");
    try {
      const parent_id = req.user.userId;
      const kidId = req.params.id;

      if (!parent_id || !kidId) {
        return res.status(400).send("some data is missing");
      }

      const isInSameFamily = await isKidInSameFamily(
        this.sequelize,
        parent_id,
        kidId
      );
      if (!isInSameFamily) {
        return res
          .status(400)
          .send("Some problems at getLimits with the data.");
      }
      //get the limits of the kid
      const SQL = `SELECT kid_id,ratio,sun_start,sun_end,mon_start,mon_end,tue_start,
            tue_end,wed_start,wed_end,thu_start,thu_end,fri_start,fri_end,sat_start,sat_end 
            FROM kids 
            where    kid_id=:kidId and is_active=1 `;
      const kidLimits = await this.sequelize.query(SQL, {
        replacements: { kidId },
        type: QueryTypes.SELECT,
      });

      return res.status(200).send({ kidLimits });
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in getting limits.",
      });
    }
  };

  //POST api/parent/limits
  //kp-41
  postLimits = async (req, res) => {
    console.log("postLimits");
    try {
      const { userId: parent_id } = req.user;
      const { kidId, ...incomingLimits } = req.body;

      if (!parent_id || !kidId) {
        return res.status(400).send("Required data is missing.");
      }

      const isInSameFamily = await isKidInSameFamily(
        this.sequelize,
        parent_id,
        kidId
      );
      if (!isInSameFamily) {
        return res
          .status(400)
          .send("The specified kid does not belong to the same family.");
      }

      const invalidFields = Object.entries(incomingLimits).filter(
        ([key, value]) =>
          !allowedFields[key] || !checkType(value, allowedFields[key])
      );

      if (invalidFields.length > 0) {
        return res
          .status(400)
          .send("Invalid or improperly formatted fields provided.");
      }


      const updates = Object.entries(incomingLimits)
        .filter(([key, value]) => value !== null && value !== undefined)
        .map(([key, value]) => `${key} = :${key}`)
        .join(", ");

      if (updates.length === 0) {
        return res.status(400).send("No valid fields to update.");
      }

      const SQL = `UPDATE kids SET ${updates}, updateAt = NOW() WHERE kid_id = :kidId AND is_active = 1 ;`;
      console.log(SQL);
      console.log({ ...incomingLimits, kidId });
      await this.sequelize.query(SQL, {
        replacements: { ...incomingLimits, kidId },
        type: QueryTypes.UPDATE,
      });

      return res.status(200).send("Limits updated successfully.");
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred while updating limits.",
      });
    }
  };

  ////////////////////////////

  // GET /api/parent/sayhi
  hello = async (req, res) => {
    try {
      res.status(200).send("Hello from parents controller");
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in hello parent.",
      });
    }
  };
}
export default ControllerParents;

//test to be done
//parent gets kids (no kids, one kids, multiple kids)
//parent getLimits for each kid
//parent postLimits for each kid (no change all fields change)
