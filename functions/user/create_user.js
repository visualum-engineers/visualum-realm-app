exports = async function ({
  email = "",
  email_verified = false,
  account_type = "",
  additional_data = {},
}) {
  //user collection
  const database = context.services.get("mongodb-atlas").db("Development");
  const collection = database.collection("users");
  const user_id = context.user.id;
  const name = context.user.data.name;
  let new_user_document;
  try {
    const [first_name, last_name] = name.split(" ");
    new_user_document = {
      ...additional_data,
      _id: user_id,
      account_type: account_type,
      user_profile: {
        email: email,
        email_confirmed: email_verified,
        first_name: first_name,
        last_name: last_name,
        user_id: user_id
      },
      user_creation_date: new Date(),
      user_points: [],
      user_settings: {},
    };
    //we must create an organization document
    if (account_type === "admin") {
      const org_collection = database.collection("organizations");
      const org_data = {
        ...additional_data.org_data,
        organization_name: additional_data.organization_name,
        _id: new BSON.ObjectId(),
        admins: [new_user_document._id],
      };
      const org_id = await org_collection.insertOne(org_data);
      new_user_document.organization_id = org_id;
    }
  } catch (e) {
    const errorParms = {
      error_message: "invalid new user document",
      error_metadata: e,
    };
    throw context.functions.execute("create_async_error", errorParms);
  }

  try {
    const result = await collection.insertOne(new_user_document);
    return {
      error: null,
      message: `successfully created user`,
      result: result,
    };
  } catch (e) {
    const errorParms = {
      error_message:
        "could not create a new user. Invalid information, or user already exists",
      error_metadata: {
        doc_attempted: new_user_document,
        stack_trace: e,
      },
    };
    throw context.functions.execute("create_async_error", errorParms);
  }
};
