import {connectDB} from "../../../utils/connect"
import User from "../../../../models/userModel"
import bcrypt from "bcrypt"; 
import { NextResponse } from 'next/server';
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const { userName, email, password } = body;

    console.log( userName, email, password );
    const exists=await User.findOne({$or:[{userName},{email}]});
    if(exists){
      return NextResponse.json({message:"User Already Exists"},{status:500});
    }
    const HashedPassword=await bcrypt.hash(password,10);
    await User.create({userName,email,password:HashedPassword})

    return NextResponse.json({ message: 'User registered successfully' }, { status: 201 });
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
