const express = require("express");
const bodyParser = require("body-parser");
const { check, validationResult } = require("express-validator");
const { text } = require("body-parser");
const path = require("path");
const e = require("express");

//Setup DB connection
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/narinderstore" /*path of DB*/, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//setup the model for the order
//collection is collection of objects
//This is model for one object Order that is part of collection orders
const Order = mongoose.model("Order", {
  /*here we are not passing any values, we are setting up the structure of Order object */
  //model tells the values and the datatype of values that are stored in DB
  name: String,
  emailAddress: String,
  phoneNumber: String,
  address: String,
  city: String,
  postcode: String,
  province: String,
  quantityChairInput: Number,
  quantityTableInput: Number,
  quantityVaseInput: Number,
  quantityFlowersInput: Number,
  quantityLampInput: Number,
  shipping: Number,
  subTotal: Number,
  tax: Number,
  total: Number,
});
var myApp = express();

myApp.use(bodyParser.urlencoded({ extended: true }));
myApp.use(express.static(__dirname + "/public"));

myApp.set("views", path.join(__dirname, "views"));
myApp.set("view engine", "ejs");

const calculateSubtotal = (formData) => {
  let subTotal = 0;
  if (Number(formData.quantityChairInput) > 0) {
    subTotal += formData.quantityChairInput * 5;
  }
  if (Number(formData.quantityTableInput) > 0) {
    subTotal += formData.quantityTableInput * 4;
  }
  if (Number(formData.quantityVaseInput) > 0) {
    subTotal += formData.quantityVaseInput * 2;
  }
  if (Number(formData.quantityLampInput) > 0) {
    subTotal += formData.quantityLampInput * 1;
  }
  if (Number(formData.quantityFlowersInput) > 0) {
    subTotal += formData.quantityFlowersInput * 3;
  }
  return subTotal;
};

const calculateTax = (subTotal, formData) => {
  let tax = 0;
  if (formData.province == "AB") {
    tax = 0.05 * subTotal;
  } else if (formData.province == "BC") {
    tax = 0.12 * subTotal;
  } else if (formData.province == "MB") {
    tax = 0.12 * subTotal;
  } else if (formData.province == "NB") {
    tax = 0.15 * subTotal;
  } else if (formData.province == "NL") {
    tax = 0.15 * subTotal;
  } else if (formData.province == "NT") {
    tax = 0.05 * subTotal;
  } else if (formData.province == "NS") {
    tax = 0.15 * subTotal;
  } else if (formData.province == "NU") {
    tax = 0.05 * subTotal;
  } else if (formData.province == "ON") {
    tax = 0.13 * subTotal;
  } else if (formData.province == "PE") {
    tax = 0.15 * subTotal;
  } else if (formData.province == "QC") {
    tax = 0.14975 * subTotal;
  } else if (formData.province == "AB") {
    tax = 0.11 * subTotal;
  } else {
    tax = 0.05 * subTotal;
  }
  return tax;
};

const calculateShipping = (timeofDelivery) => {
  let shippingCharges = 0;
  if (timeofDelivery < 2) {
    shippingCharges = 20;
  } else {
    shippingCharges = 5;
  }
  return shippingCharges;
};
var phoneRegex = /^[1-9]{1}[0-9]{9}$/;

function checkRegex(userInput, regex) {
  if (regex.test(userInput)) {
    return true;
  } else {
    return false;
  }
}

function customPhoneValidation(value) {
  if (!checkRegex(value, phoneRegex)) {
    throw new Error("Please enter phonenumber in correct format:5198201234");
  }
  return true;
}

myApp.get("/", function (req, res) {
  res.render("form");
});

//all orders page
myApp.get("/allorders", function (req, res) {
  Order.find({}).exec(function (err, orders) {
    console.log(err);
    res.render("allorder", { orders: orders });
  });
});

myApp.post(
  "/",
  [
    check("name", "Name is required!").notEmpty(),
    check("emailAddress", "Email format is not correct!").isEmail(),
    check("address", "Address is required").notEmpty(),
    check("province", "Province is required").notEmpty(),
    check("city", "City is required").notEmpty(),
    check("phoneNumber", "").custom(customPhoneValidation),
  ],
  function (req, res) {
    // call a function for validations
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.render("form", { errors: errors.array() });
    } else {
      const subTotal = calculateSubtotal(req.body);
      if (subTotal < 10) {
        res.render("form", { errors: [{ msg: "Min Purchase of $10 required" }] });
      } else {
        const tax = calculateTax(subTotal, req.body);
        const shipping = calculateShipping(req.body.deliverytime);
        const priceChair = 5 * req.body.quantityChairInput;
        const priceTable = 4 * req.body.quantityTableInput;
        const priceVase = 2 * req.body.quantityVaseInput;
        const priceLamp = 1 * req.body.quantityLampInput;
        const priceFlowers = 3 * req.body.quantityFlowersInput;
        var data = {
          name: req.body.name,
          emailAddress: req.body.emailAddress,
          phoneNumber: req.body.phoneNumber,
          address: req.body.address,
          postcode: req.body.postcode,
          city: req.body.city,
          province: req.body.province,
          priceChair: priceChair,
          priceTable: priceTable,
          priceVase: priceVase,
          priceLamp: priceLamp,
          priceFlowers: priceFlowers,
          shipping: shipping,
          subTotal: subTotal + shipping,
          tax: tax,
          total: subTotal + tax,
          quantityChairInput: req.body.quantityChairInput,
          quantityTableInput: req.body.quantityTableInput,
          quantityVaseInput: req.body.quantityVaseInput,
          quantityLampInput: req.body.quantityLampInput,
          quantityFlowersInput: req.body.quantityFlowersInput,
        };

        //Create an object for the model - Order
        //Here we are storing the values of data object into myOrder object
        var myOrder = new Order(data);

        //Save the order
        myOrder.save().then(function () {
          console.log("New Order Created!");
        });

        res.render("form", data);
      }
    }
  }
);

myApp.listen(8080);
console.log("Server running");
