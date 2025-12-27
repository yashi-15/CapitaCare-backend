const mongoose = require("mongoose")

const connectDB = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URI, {})
        console.log("mongo db connected !");
        
    }
    catch (err){
        console.log(`error connecting mongo db - ${err}`);
        process.exit(1)
    }
}

module.exports = connectDB