import mongoose, { Schema } from "mongoose";
import jwt from "jsonweebtoken";
import bcrypt from "bcrypt;"

const userSchema = new Schema(
    {
        userName:{
            type: String,
            required: true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true
        },
        email:{
            type: String,
            required: true,
            unique:true,
            lowercase:true,
            trim:true,
           
        },
       fullName:{
            type: String,
            required: true,
            trim:true,
            index:true    
        },
        avtar:{
            type: String,  //cloudnary url
            required: true
               
        },
        coverImage:{
            type: String, 
        },
        watchHistory:[
            {
                type : Schema.type.ObjectId,
                ref:"Video"
            }
        ],
        password:{
            type:String,
            required:[true,`Password is required`]
        },
        refreshToken :{
            type:String

        }

 } ,
        {
             timestamps:true

        }

    
)
userSchema.pre(save, async function (next) {
    if(!this.isModified("Password")) return next();

    
    this.password =bcrypt.hash(this.password,10)
    next()
})
 
userSchema.methods.isPasswordCorrect = async function (password){
 return await  bcrypt.compare(password, this.password)
}
userSchema.methods.generateAccessToken = function(){
   return jwt.sign(
        {
            id : this._id,
            email : this.email,
            userName : this.userName,
            fullName : this.fullName

        },
        process.env.ACCESS_TOKEN_SECRET,

        
        {
            expiresIN : process.env.ACCESS_TOKEN_EXPIRY
        }

        )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            id : this._id,
            email : this.email,
            userName : this.userName,
            fullName : this.fullName

        },
        process.env.ACCESS_TOKEN_SECRET,

        
        {
            expiresIN : process.env.REFRESH_TOKEN_EXPIRY
        }

        )
}


export const user = mongoose.model("user", userSchema)