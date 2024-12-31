const bcrypt = require("bcryptjs"); // Import bcryptjs
const { mongoose } = require("mongoose");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, EXPIRE_TOKEN } = require("../../utils/config");
const { USER_ROLES } = require("../../utils/enums");

const UserSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true, // Consider adding validation
    },
    lastname: {
      type: String,
      required: true, // Consider adding validation
    },
    password: {
      type: String,
      required: true, // Consider adding validation
    },
    email: {
      type: String,
      unique: true,
      required: true, // Consider adding validation
    },
    phone: {
      type: String,
      required: true,
      unique: true, // Enforce uniqueness for phone number
    },
    role: {
      type: String,
      enum: [USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN, USER_ROLES.USER],
      required: true, // Consider adding validation
    },
  },
  { timestamps: true }
);

// Pre-save middleware to hash the password
UserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    // Only hash the password if it has been modified
    const salt = await bcrypt.genSalt(10); // Generate salt
    this.password = await bcrypt.hash(this.password, salt); // Hash the password
  }
  next(); // Proceed to save the user
});

// Method to create a user
UserSchema.pre("save", async function (next) {
  if (this.isModified("phone")) {
    const existing = await mongoose
      .model("user")
      .findOne({ phone: this.phone });
    if (existing) {
      throw new Error(
        this.phone + " :Phone number already associated with an existing user."
      );
    }
  }
  next();
});

// Method to verify the password
UserSchema.methods.verifyPassword = async function (password) {
  return await bcrypt.compare(password, this.password); // Compare the provided password with the hashed password
};

// JWT Token generation method
UserSchema.methods.jwtGenerateToken = function () {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
      username: `${this.firstname} ${this.lastname}`,
    },
    JWT_SECRET,
    {
      expiresIn: EXPIRE_TOKEN,
    }
  );
};

module.exports = mongoose.model("user", UserSchema);
