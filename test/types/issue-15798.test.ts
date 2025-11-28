import mongoose, { Schema } from 'mongoose';

// Test 1: versionKey: false
const MySchema1 = new Schema({
  name: { type: String, required: true },
}, {
  statics: {
    testMe: function () {
      console.log(`I'm a static method`);
    }
  },
  versionKey: false,
});

const MyModel1 = mongoose.model('MyModel1', MySchema1);

// this should NOT trigger a type error
MyModel1.testMe();

// Test 2: timestamps: true  
const MySchema2 = new Schema({
  name: { type: String, required: true }
}, {
  timestamps: true,
  statics: {
    testMe() {
      return this.findOne({ name: 'test' });
    }
  }
});

const MyModel2 = mongoose.model('MyModel2', MySchema2);

// this should NOT trigger a type error
MyModel2.testMe();
