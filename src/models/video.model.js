import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile:{
            type:String, //cloudnary url
            reqired :true
        },
         thumbnail:{
            type:String,
            reqired :true,
         },
        title:{
            type:String,
            reqired :true,
         },
         description:{
            type:String,
            reqired :true,
         },
         time:{
            type:Number,
            reqired :true,
         },
         view:{
            type: Number,
            default:0,
         },
         isPblished:{
            type:Boolean,
            default:true
         },
         owner:{
            type:Schema.Types.ObjectId,
            ref:"User"
         }
        
    },
    {
        timestamps:true
    }
)
videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema);
