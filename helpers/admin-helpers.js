let db = require("../config/connectiion");
let collection = require("../config/collections");
let bcrypt = require("bcrypt");
const { response } = require("../app");
const moment = require("moment");
const { ObjectId } = require("mongodb");

//admin login 
module.exports = {
  doSignup: (userData) => {
    return new Promise(async (res, rej) => {
      userData.password = await bcrypt.hash(userData.password, 10);
      db.get()
        .collection(collection.ADMIN_COLLECTION)
        .insertOne(userData)
        .then((data) => {
          res(data.insertedId);
        });
    });
  },
  doLogin: (adminData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let admin = await db
        .get()
        .collection(collection.ADMIN_COLLECTION)
        .findOne({ Email: adminData.Email });
      if (admin) {
        bcrypt.compare(adminData.password, admin.password).then((status) => {
          if (status) {
            response.admin = admin;
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
  // coupon management admin side
  addCoupon: (data) => {
    return new Promise(async (res, rej) => {
      let expiry = await moment(data.Expiry).format("YYYY-MM-DD");
      let starting = await moment(data.Starting).format("YYYY-MM-DD");
      let dateobj = await {
        Coupon: data.Coupon,
        Offer: parseInt(data.Offer),
        Starting: data.starting,
        Expiry: data.expiry,
        Users: [],
      };
      db.get()
        .collection(collection.COUPON_COLLECTION)
        .insertOne(dateobj)
        .then(() => {
          res();
        })
        .catch((err) => {
          res(err);
        });
    });
  },
  // coupon offer after admin enter
  startCouponOffers: (date) => {
    let couponStartDate = new Date(date);
    return new Promise(async (res, rej) => {
      let data = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .find({ Starting: { $lte: couponStartDate } })
        .toArray();
      if (data.length > 0) {
        await data.map((onedata) => {
          db.get()
            .collection(collection.COUPON_COLLECTION)
            .updateOne(
              { _id: ObjectId(onedata.id) },
              {
                $set: {
                  Available: true,
                },
              }
            )
            .then(() => {
              res();
            });
        });
      } else {
        res();
      }
    });
  },
  // view coupon collections
  getAllCoupons: () => {
    return new Promise((res, rej) => {
      let coupons = db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .find()
        .toArray();
      res(coupons);
    });
  },
  // delete coupon
  deleteCoupon: (id) => {
    return new Promise((res, rej) => {
      db.get()
        .collection(collection.COUPON_COLLECTION)
        .deleteOne({ _id: ObjectId(id) })
        .then(() => {
          res();
        });
    });
  },
  //monthly sales count to Dashborad
  countsalemonth: () => {
    return new Promise(async (resolve, reject) => {
      let dailySale = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: {
              status: "Placed",
            },
          },

          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m", date: "$Date" } },
              totalAmount: { $sum: "$totalAmount" },
              count: { $sum: 1 },
            },
          },
          {
            $sort: { _id: -1 },
          },
        ])
        .toArray();
      resolve(dailySale);
    });
  },
  // count the daily sales
  countDaySales: () => {
    return new Promise(async (resolve, reject) => {
      let dailySale = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: {
              status: "delivered",
            },
          },

          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$Date" } },
              totalAmount: { $sum: "$totalAmount" },
              count: { $sum: 1 },
            },
          },
          {
            $sort: { _id: -1 },
          },
          {
            $limit: 7,
          },
        ])
        .toArray();
      resolve(dailySale);
    });
  },
    // yearly sales for chartjs
    getYearlySale: () => {
        let curDate = new Date();
        let currentYear = curDate.getFullYear();
        currentYear = currentYear + "";
    
        return new Promise(async (resolve, reject) => {
          let yearlySale = await db
            .get()
            .collection(collection.ORDER_COLLECTION)
            .aggregate([
              {
                $match: {
                  status: "Placed",
                },
              },
              {
                $project: {
                  Date: { $dateToString: { format: "%Y", date: "$Date" } },
                  totalAmount: 1,
                },
              },
    
              {
                $group: {
                  _id: "$Date",
                  total: { $sum: "$totalAmount" },
                },
              },
            ])
            .toArray();
          resolve(yearlySale);
        });
      },
  //Total orders form users
  TotalOders: () => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          { $group: { _id: null, count: { $sum: 1 } } },
          { $project: { _id: 0 } },
        ])
        .toArray();
      resolve(total);
    });
  },
  //Total Sales form users
  Totalsales: () => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: {
              status: "Placed",
            },
          },
          { $group: { _id: null, count: { $sum: 1 } } },
          { $project: { _id: 0 } },
        ])
        .toArray();
      resolve(total);
    });
  },
  //Total profit to dashborad
  Totalprofit: () => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: {
              status: "Placed",
            },
          },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } },
          { $project: { _id: 0 } },
        ])
        .toArray();
      resolve(total);
    });
  },
  // no of users use booklovers web-app
  Totalusers: () => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .aggregate([
          { $group: { _id: null, count: { $sum: 1 } } },
          { $project: { _id: 0 } },
        ])
        .toArray();
      resolve(total);
    });
  },
  // placed order update to del,ship,cancel
  updatedeliverystatus: (status, orderId) => {
    return new Promise((resolve, reject) => {

      if (status == "delivered") {
        db.get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: ObjectId(orderId) },
            {
              $set: {
                status: status,
                cancelled: false,
                Delivered: true,
              },
            }
          );
      } else if (status == "cancelled") {
        db.get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: ObjectId(orderId) },
            {
              $set: {
                status: status,
                Cancelled: true,
                Delivered: false,
              },
            }
          );
      } else {
        db.get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: ObjectId(orderId) },
            {
              $set: {
                status: status,
              },
            }
          )
          .then((response) => {
            resolve(true);
          });
      }
    });
  },
};
