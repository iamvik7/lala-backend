const Db = require("../../utils/db");
const { USER_ROLES } = require("../../utils/enums");
const { COLLECTION_NAMES } = require("../../utils/modelEnums");

exports.createUser = async (body, type, session) => {
  try {
    const { firstname, lastname, email, phone, password } = body;
    const [user, userError] = await Db.fetchOne({
      collection: COLLECTION_NAMES.USERMODEL,
      query: { email },
    });

    if (userError) {
      return [null, "Error while creating user try again later: " + userError];
    }

    if (user) {
      return [null, "Email already associated with user!" ];
    }

    const [addUser, addUserError] = await Db.create({
      collection: COLLECTION_NAMES.USERMODEL,
      body: {
        firstname,
        lastname,
        phone,
        email,
        password,
        ...(type === USER_ROLES.ADMIN
          ? { role: USER_ROLES.ADMIN }
          : { role: USER_ROLES.USER }),
      },
      session,
    });

    if (addUserError) {
      return [
        null,
        "Error while creating user try again later: " + addUserError,
      ];
    }
    return ["User added successfully!", null];
  } catch (error) {
    return [null, error.message || error];
  }
};
