const mongoClient=require('mongodb').MongoClient
const state={
    db:null
}

module.exports.connect=function(done){
    const url=process.env.booklovers
    const dbname='books-e-commerce'

    mongoClient.connect(url,(err,data)=>{
        if(err) return done(err)
        state.db=data.db(dbname)
        done()
    })

}
module.exports.get=function(){
    return state.db
}
