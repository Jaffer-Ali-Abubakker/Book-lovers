var db = require("../config/connectiion");
var collection = require("../config/collections");
const { ObjectId } = require("mongodb");
var objectId = require("mongodb").ObjectId;
module.exports = {
  // add Genres to gener collection
  addGener: (gener, callback) => {
    db.get()
      .collection("gener")
      .insertOne(gener)
      .then((data) => {
        callback(data.insertedId);
      });
  },
  // get all genres form collections
  getAllGeners: () => {
    return new Promise(async (resolve, reject) => {
      let geners = await db
        .get()
        .collection(collection.GENER_COLLECTION)
        .find()
        .toArray();
      resolve(geners);
    });
  },
  // delete genres form genres collection
  deleteGenres: (GenrId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.GENER_COLLECTION)
        .remove({ _id: objectId(GenrId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  // get one genre
  getOneGener: (GenId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: objectId(GenId) })
        .then((gener) => {
          resolve(gener);
        });
    });
  },
};
