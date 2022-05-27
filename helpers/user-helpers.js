var db = require("../config/connectiion");
var collection = require("../config/collections");
var objectId = require("mongodb").ObjectId;
const bcrypt = require("bcrypt");
const moment = require("moment");
const { response } = require("../app");
const Razorpay = require("razorpay");
const { resolve } = require("path");
const { ObjectId } = require("mongodb");
var instance = new Razorpay({
  key_id: process.env.key_id,
  key_secret: process.env.key_secret,
});
module.exports = {
  doSignup: (userData) => {
    return new Promise(async (res, rej) => {
      userData.password = await bcrypt.hash(userData.password, 10);
      db.get()
        .collection(collection.USER_COLLECTION)
        .insertOne(userData)
        .then((data) => {
          res(data.insertedId);
        });
    });
  },
  // user login
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Email: userData.Email });
      if (user) {
        bcrypt.compare(userData.password, user.password).then((status) => {
          if (status) {
            response.user = user;
            response.status = true;
            resolve(response);
          } else {
            resolve({ status: false });
          }
        });
      } else {
        resolve({ status: false });
      }
    });
  },
  // get all user form user collection
  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find()
        .toArray();
      resolve(user);
    });
  },
  // block the user
  updateUser: (UserId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(UserId) },
          {
            $set: {
              status: "block",
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  // unblock the user
  updateUserr: (UserId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(UserId) },
          {
            $set: {
              status: "unblock",
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  // delete the user by admin
  deleteUsers: (UserId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .remove({ _id: objectId(UserId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  // check the email $ phonenumber while user signup
  emailCheck: (email, phone) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ $or: [{ Email: email }, { phoneNumber: phone }] });
      resolve(user);
    });
  },
  // user add the product to cart
  addToCart: (proId, UserId) => {
    let proObj = {
      item: objectId(proId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(UserId) });
      if (userCart) {
        let proExist = userCart.products.findIndex(
          (product) => product.item == proId
        );
        if (proExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(UserId), "products.item": objectId(proId) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(UserId) },
              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              resolve();
            });
        }
      } else {
        let cartObj = {
          user: objectId(UserId),
          products: [proObj],
        };
        db.get()
          .collection(collection.CART_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {
            resolve(response);
          });
      }
    });
  },
  // fetch the product from cart collection
  getCartProducts: (UserId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(UserId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      resolve(cartItems);
    });
  },
  // get cart count
  getCartCount: (UserId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(UserId) });
      if (cart) {
        count = cart.products.length;
      }
      resolve(count);
    });
  },
  // change the quantity of cart
  changeProductQuantity: (details) => {
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);

    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { _id: objectId(details.cart) },
            {
              $pull: { products: { item: objectId(details.product) } },
            }
          )
          .then((response) => {
            resolve({ deleteProduct: true });
          });
      } else {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            {
              _id: objectId(details.cart),
              "products.item": objectId(details.product),
            },
            {
              $inc: { "products.$.quantity": details.count },
            }
          )
          .then((response) => {
            resolve({ status: true });
          });
      }
    });
  },
  // delete the product from cart
  DeleteCartProduct: (details) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { _id: ObjectId(details.cart) },
          {
            $pull: { products: { item: ObjectId(details.product) } },
          }
        )
        .then((response) => {
          resolve({ removeProduct: true });
        });
    });
  },
  // get total amount to cart
  getTotalAmount: (UserId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(UserId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ["$quantity", "$product.price"] } },
            },
          },
        ])
        .toArray();
      resolve(total[0]?.total);
    });
  },
  // order details is save to order collection
  placeOrder: (order, products, total) => {
    return new Promise((resolve, reject) => {
      let status = order["payment-method"] === "COD" ? "Placed" : "Placed";
      let orderObj = {
        deliveryDetails: {
          Name: order.Name,
          Email: order.Email,
          City: order.City,
          pincode: order.pincode,
          phone: order.phone,
          address: order.DAddress,
        },
        UserId: objectId(order.UserId),
        paymentMethod: order["payment-method"],
        products: products,
        totalAmount: total,
        status: status,
        date: new Date().toLocaleString(),
        Date: new Date(),
      };

      db.get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          db.get()
            .collection(collection.CART_COLLECTION)
            .deleteOne({ user: objectId(order.UserId) });
          resolve(response.insertedId);
        });
    });
  },
  //get product from cart
  getCartProductList: (UserId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(UserId) });
      resolve(cart);
    });
  },
  // get user order details
  getUserOrders: (UserId) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ UserId: objectId(UserId) })
        .sort({ date: -1 })
        .toArray();

      resolve(orders);
    });
  },
  // get order placed details
  getUserOrdersplaceOrder: (UserId) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ UserId: objectId(UserId) })
        .sort({ date: -1 })
        .limit(1)
        .toArray();
      resolve(orders);
    });
  },
  //get user order products
  getOrderProducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orderItems = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { _id: objectId(orderId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      resolve(orderItems);
    });
  },
  // Razorpay payment gateway
  generateRazorpay: (orderId, total) => {
    return new Promise((resolve, reject) => {
      var options = {
        amount: total * 100,
        currency: "INR",
        receipt: "" + orderId,
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
        } else {
          resolve(order);
        }
      });
    });
  },
  // Razorpay payment verification
  verifyPayment: (details) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", "8HrZ294PkCIxOtIVcRrf7ySj");

      hmac.update(
        details["payment[razorpay_order_id]"] +
          "|" +
          details["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");
      if (hmac == details["payment[razorpay_signature]"]) {
        resolve();
      } else {
        reject();
      }
    });
  },
  // change the payment status
  changePaymentStatus: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              status: "placed",
            },
          }
        )
        .then(() => [resolve()]);
    });
  },
  // user Discount management
  getDiscount: (UserId) => {
    return new Promise(async (resolve, reject) => {
      let totaldiscount = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(UserId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $group: {
              _id: null,
              discount: {
                $sum: {
                  $multiply: [
                    { $toInt: "$quantity" },
                    { $toInt: "$product.discount" },
                    { $toInt: "$product.price" },
                  ],
                },
              },
            },
          },
        ])
        .toArray();
      resolve(totaldiscount[0]?.discount);
    });
  },
  // get all users orders
  getAllUserOrders: () => {
    return new Promise(async (resolve, reject) => {
      let Order = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find()
        .sort({ date: -1 })
        .toArray();
      resolve(Order);
    });
  },
  // weekly sales report to admin page
  getWeekReport: (previousWeek) => {
    return new Promise(async (resolve, reject) => {
      let weeklyReport = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ Date: { $gte: previousWeek } })
        .sort({ Date: -1 })
        .toArray();
      resolve(weeklyReport);
    });
  },
  // monthly sales report to admin page
  getMonthReport: (previousMonth) => {
    return new Promise(async (resolve, reject) => {
      let monthlyReport = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ Date: { $gte: previousMonth } })
        .sort({ Date: -1 })
        .toArray();
      resolve(monthlyReport);
    });
  },
  // yearly sales report to admin page
  getYearReport: (previousYear) => {
    return new Promise(async (resolve, reject) => {
      let YearlyReport = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ Date: { $gte: previousYear } })
        .sort({ Date: -1 })
        .toArray();
      resolve(YearlyReport);
    });
  },
  // applied coupon validation
  couponValidate: (data, user) => {
    return new Promise(async (resolve, reject) => {
      obj = {};
      let date = new Date();
      date = moment(date).format("YYYY-MM-DD");
      let coupon = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .findOne({ Coupon: data.Coupon });
      if (coupon) {
        let couponId = coupon._id;
        let users = coupon.Users;
        let userChecker = users.includes(user);
        if (userChecker) {
          obj.couponUsed = true;
          resolve(obj);
        } else {
          if (date <= coupon.Expiry) {
            let total = parseInt(data.Total);
            let percentage = parseInt(coupon.Offer);
            let discountVal = ((total * percentage) / 100).toFixed();
            obj.total = total - discountVal;
            obj.success = true;
            obj.couponId = couponId;
            resolve(obj);
          } else {
            obj.couponExpired = true;
            resolve(obj);
          }
        }
      } else {
        obj.invalidCoupon = true;
        resolve(obj);
      }
    });
  },
  // add coupon status expiry or not
  couponStatusAdd: (userId, Id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.COUPON_COLLECTION)
        .updateOne(
          { _id: ObjectId(Id) },
          {
            $push: { Users: userId },
          }
        )
        .then((result) => {
          resolve(result);
        });
    });
  },
  // user details for user profile
  getAllUserDetails: (UserId) => {
    return new Promise(async (resolve, reject) => {
      let UserDetails = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId(UserId) });
      resolve(UserDetails);
    });
  },
  // update user details in profile
  updateUserprofile: (data) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { Name: data.Name },
          {
            $set: {
              Name: data.Name,
              Email: data.Email,
              phoneNumber: data.phoneNumber,
              Address: data.Address,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  // product add to wish list
  addedToWishList: (proId, userId) => {
    let proObj = {
      item: ObjectId(proId),
    };
    return new Promise(async (resolve, reject) => {
      let userWish = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .findOne({ user: ObjectId(userId) });
      if (userWish) {
        let proExist = userWish.wishList.findIndex((pro) => pro.item == proId);
        if (proExist == -1) {
          db.get()
            .collection(collection.WISHLIST_COLLECTION)
            .updateOne(
              { user: ObjectId(userId) },
              {
                $push: {
                  wishList: proObj,
                },
              }
            )
            .then((response) => {
              resolve(response);
            });
        }
      } else {
        let wishObj = {
          user: ObjectId(userId),
          wishList: [proObj],
        };
        db.get()
          .collection(collection.WISHLIST_COLLECTION)
          .insertOne(wishObj)
          .then((response) => {
            resolve(response);
          });
      }
    });
  },
  // get all products form wish list
  getWishProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let wishItems = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .aggregate([
          {
            $match: { user: ObjectId(userId) },
          },
          {
            $unwind: "$wishList",
          },
          {
            $project: {
              item: "$wishList.item",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      resolve(wishItems);
    });
  },
  // get product count form wishlist
  getWishCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let wish = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .findOne({ user: ObjectId(userId) });

      if (wish) {
        count = wish.wishList.length;
      }
      resolve(count);
    });
  },
  // delete product from wishlist
  removeWishProduct: (details) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.WISHLIST_COLLECTION)
        .updateOne(
          { _id: ObjectId(details.wish) },

          {
            $pull: { wishList: { item: ObjectId(details.product) } },
          }
        )
        .then((response) => {
          resolve({ removeProduct: true });
        });
    });
  },
  // change password for user
  passwordMatch: (oldPassword, userId) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: ObjectId(userId) });
      if (user) {
        bcrypt.compare(oldPassword, user.password).then((response) => {
          resolve(response);
        });
      }
    });
  },
  // update the new password
  updatePassword: (newPassword, userId) => {
    return new Promise(async (resolve, reject) => {
      newPassword = await bcrypt.hash(newPassword, 10);
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectId(userId) },

          {
            $set: {
              password: newPassword,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  // add address form profile
  addAddress: (userId, data) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: ObjectId(userId) });

      if (user) {
        data._id = ObjectId();
        if (user.address) {
          db.get()
            .collection(collection.USER_COLLECTION)
            .updateOne(
              { _id: ObjectId(userId) },
              {
                $push: { address: data },
              }
            )
            .then((response) => {
              resolve(response);
            })
            .catch((err) => {
              resolve(err);
            });
        } else {
          //let add = [data];
          db.get()
            .collection(collection.USER_COLLECTION)
            .updateOne(
              { _id: ObjectId(userId) },
              {
                $set: {
                  address: data.address,
                  city: data.City,
                  pincode: data.pincode,
                  Alladdress: true,
                },
              }
            )
            .then((response) => {
              resolve(response);
            })
            .catch((err) => {
              resolve(err);
            });
        }
      }
    });
  },
  // edit user details form user profile
  editDetails: (userId, data) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectId(userId) },
          {
            $set: {
              Name: data.Name,
              Email: data.Email,
              city: data.City,
              pincode: data.pincode,
              phoneNumber: data.phoneNumber,
              address: data.address,
            },
          }
        )
        .then((response) => {
          resolve(response);
        })
        .catch((err) => {
          resolve(err);
        });
    });
  },
  //post message from user page
  addusermessage: (message) => {
    return new Promise(async (res, rej) => {
      db.get()
        .collection(collection.USER_MESSAGE_COLLECTION)
        .insertOne(message)
        .then((data) => {
          res(data.insertedId);
        });
    });
  },
  // view the meassage in mail page
  viewusermessage1: () => {
    return new Promise(async (resolve, reject) => {
      let message = await db
        .get()
        .collection(collection.USER_MESSAGE_COLLECTION)
        .find()
        .limit(1)
        .toArray();
      resolve(message);
    });
  },
  // view the second user message in main page
  viewusermessage2: () => {
    return new Promise(async (resolve, reject) => {
      let message = await db
        .get()
        .collection(collection.USER_MESSAGE_COLLECTION)
        .find()
        .limit(-2)
        .skip(-1)
        .toArray();
      resolve(message);
    });
  },
  // view that latest message in main page
  viewusermessage3: () => {
    return new Promise(async (resolve, reject) => {
      let message = await db
        .get()
        .collection(collection.USER_MESSAGE_COLLECTION)
        .find()
        .limit(1)
        .sort({ $natural: -1 })
        .toArray();
      resolve(message);
    });
  },
  // search product in user page
  searchProduct: (name) => {
    return new Promise(async (resolve, reject) => {
      let search = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ Name: { $regex: new RegExp("^" + name + ".*", "i") } })
        .toArray();
      resolve(search);
    });
  },
  // placed order cancel
  canelOrderreq: (data, orderId) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(data.orderId) },

          {
            $set: {
              status: data.status,
              cancelled: true,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  //add phone number to userid
  addphoneDetails: (data, userId) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: {
              phoneNumber: data.phoneNumber,
            },
          }
        )
        .then(response);
      resolve(response);
    });
  },
  getAllUserOrderstoDashboard: () => {
    return new Promise(async (resolve, reject) => {
      let Order = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find()
        .sort({ date: -1 })
        .limit(10)
        .toArray();
      resolve(Order);
    });
  },
};
