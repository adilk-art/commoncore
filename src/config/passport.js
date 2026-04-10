import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { findUserByEmail,createUser,findUserById,findUserByGoogleId } from "../repositories/user.repository.js";

passport.use(
    new GoogleStrategy(                                 //google identifying our app with our app details 
        {
        clientID:process.env.GOOGLE_CLIENT_ID,
        clientSecret:process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:process.env.GOOGLE_CALLBACK_URL,
       },
    async(accessToken,refreshToken,profile,done)=>{       //run after google send user data via callbackURL
        try{                                              //'profile' is the user profile and 'done' is the function which tells passport what happened
            const email=profile.emails[0].value;
            const googleId=profile.id;
            const name=profile.displayName;

            let user=await findUserByGoogleId(googleId);
            if(user) return done(null,user);

            user=await findUserByEmail(email);
            if(user){
                user.googleId=googleId;
                await user.save();
                return done(null,user);
            }

            user=await createUser({
                name,
                email,
                googleId,
                password:null
            });
            
            return done(null,user);
            

        }catch(err){
            return done(err,null)
        }
    })
)

passport.serializeUser((user,done)=>{   //storing userId in session
    done(null,user._id)
}
)

passport.deserializeUser(async(id,done)=>{     //fetching user from db using id in session
    try{
        const user=await findUserById(id);
        done(null,user);

    }catch(err){
        done(err,null)
    }
})

export default passport;