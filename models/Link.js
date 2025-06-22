import mongoose from 'mongoose';


const sourceClickSchema = new mongoose.Schema({
  name:{
  type:String,
  required:true,
  },
  clicks:{
    type:Number,
    default:0,
  }
},{_id:false});


const linkSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    trim: true,
    required: true,
  },
  shortUrl: {
    type: String,
    required: true,
    unique: true,
  },  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  clicks: {
    type: Number,
    default: 0,
  },

  sources: { 
        type: [sourceClickSchema], 
        default: [],    
    },


  createdAt: {
    type: Date,
    default: Date.now,
  },

});

export default mongoose.model('Link', linkSchema);