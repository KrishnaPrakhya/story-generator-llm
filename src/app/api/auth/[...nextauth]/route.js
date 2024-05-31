import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "../../../../utils/connect";
import User from "../../../../../models/userModel";
import bcrypt from "bcrypt";

const login = async (credentials) => {
  try {
    await connectDB();
    const user = await User.findOne({ email: credentials.email });
    if (!user) throw new Error("Wrong Credentials");
    const isCorrect = await bcrypt.compare(credentials.password, user.password);
    if (!isCorrect) throw new Error("Wrong Credentials");
    return user;
  } catch (error) {
    throw new Error("Something went wrong");
  }
};

export const authOptions = {
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {},
      async authorize(credentials, req) {
        try {
          console.log(credentials);
          const user = await login(credentials);
          console.log(user);
          console.log({ credentials });
          if (user) {
            return user;
          } else {
            return null;
          }
        } catch (error) {
          console.log(error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.name = token.userName;
        session.user.email = token.email;
        session.user.password = token.password;
      }
      console.log(token);
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.userName = user.userName; 
        token.email = user.email;
        token.password = user.password;
      }
      console.log(token);
      return token;
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
