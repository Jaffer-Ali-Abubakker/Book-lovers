var db=require('../config/connectiion')
var collection=require('../config/collections')
var objectId=require('mongodb').ObjectId

module.exports={
 // add authors 
    addAuthor:(author,callback)=>{
        db.get().collection('author').insertOne(author).then((data)=>{
            callback(data.insertedId)
        })
    },
    // get all authors
    getAllAuthor:()=>{
        return new Promise(async(resolve,reject)=>{
            let Authors=await db.get().collection(collection.AUTHOR_COLLECTION).find().toArray()
            resolve(Authors)
        })
    },
    
}