var db = require("../config/connectiion");
var collection = require("../config/collections");
const { ObjectId } = require("mongodb");
var objectId = require("mongodb").ObjectId;
module.exports = {
  //add products to product collections
  addProduct: (product, callback) => {
    db.get()
      .collection("product")
      .insertOne(product)
      .then((data) => {
        callback(data.insertedId);
      });
  },
  // get all product form product collection
  getAllProducts: (callback) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .limit(11)
        .toArray();
      resolve(products);
    });
  },
  // delete product form collection
  deleteProduct: (prodId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .deleteOne({ _id: objectId(prodId) })
        .then((response) => {
          resolve(response.Name);
        });
    });
  },
  // get each product details
  getProductDetails: (proId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: objectId(proId) })
        .then((product) => {
          resolve(product);
        });
    });
  },
  // edit product form product collection & update
  updateProduct: (proId, proDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: objectId(proId) },
          {
            $set: {
              Name: proDetails.Name,
              Author: proDetails.Author,
              Rating: proDetails.rating,
              price: proDetails.price,
              category: proDetails.category,
              discount: proDetails.discount,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  // product sorted by genre
  getProductgeners: (data) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ category: data.category })
        .toArray()
        .then((product) => {
          resolve(product);
        });
    });
  },
  // product view in admin view product page
  getAllProductsNoLimit: (callback) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .toArray();
      resolve(products);
    });
  },
  // product sorted by author
  getProductAuthors: (data) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ Author: data.Author })
        .toArray()
        .then((product) => {
          resolve(product);
        });
    });
  },
  // wishlist update
  wishUpdate: (userId, prodId) => {
    return new Promise(async (resolve, reject) => {
      let proObj = {
        userId: objectId(userId),
      };
      let product = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ _id: objectId(prodId) })
        .toArray();

      if (product[0].wishUser) {
        db.get()
          .collection(collection.PRODUCT_COLLECTION)
          .updateOne(
            { _id: objectId(prodId) },
            {
              $push: { wishUser: proObj },
            }
          )
          .then((response) => {
            resolve(response);
          });
      } else {
        db.get()
          .collection(collection.PRODUCT_COLLECTION)
          .updateOne(
            { _id: objectId(prodId) },
            {
              $set: {
                wishUser: [proObj],
              },
            }
          )
          .then((response) => {
            resolve(response);
          });
      }
    });
  },
  //wish list visable
  wishTrue: (userId, prodId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { "wishUser.userId": objectId(userId) },
          {
            $set: {
              wishList: true,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  //delete wish list from userwishlist page
  removeWish: (userId, proId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { "wishUser.userId": objectId(userId) },
          {
            $set: {
              wishList: false,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: objectId(proId) },
          {
            $pull: { wishUser: { userId: objectId(userId) } },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  // view all product in user main page
  getAllProductsMainpage: (callback) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .limit(9)
        .toArray();
      resolve(products);
    });
  },
  // new arrival book to main page of user
  getnewarrival: (callback) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .limit(6)
        .sort({ $natural: -1 })
        .toArray();
      resolve(products);
    });
  },
  // recommended books for user in main page
  getrecommended: (callback) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .limit(3)
        .sort()
        .toArray();
      resolve(products);
    });
  },
  // banner management add new one
  addBanner: (banner, callback) => {
    db.get()
      .collection("banner")
      .insertOne(banner)
      .then((data) => {
        callback(data.insertedId);
      });
  },
  // last upload banner only view
  getAllBanner: (callback) => {
    return new Promise(async (resolve, reject) => {
      let banner = await db
        .get()
        .collection(collection.BANNER_COLLECTION)
        .find()
        .limit(1)
        .sort({ $natural: -1 })
        .toArray();
      resolve(banner);
    });
  },
  // view banner in main page of user
  getAllBannerview: (callback) => {
    return new Promise(async (resolve, reject) => {
      let banner = await db
        .get()
        .collection(collection.BANNER_COLLECTION)
        .find()
        .toArray();
      resolve(banner);
    });
  },
  // delete banner form admin
  deleteBanner: (id) => {
    return new Promise((res, rej) => {
      db.get()
        .collection(collection.BANNER_COLLECTION)
        .deleteOne({ _id: ObjectId(id) })
        .then(() => {
          res();
        });
    });
  },
};
