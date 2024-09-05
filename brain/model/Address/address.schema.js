const addressDesign = {
  recipent: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
    max: 10,
    trim: true,
  },
  house: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  street: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  landmark: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  zipcode: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
};

module.exports = addressDesign