const user = require("../model/usermodel");
const islogin=async(req,res,next)=>{
    try {
        
        if(req.session.user || process.env.NODE_ENV ){
            if (process.env.NODE_ENV === 'test') {
                            //mock user 1
                req.session.user = 'abhishekabtr@gmail.com'
                req.session.userid = '65ca2804662a5c3593c66987'
                      //mock user 2
            //    req.session.user ='aaa@gmail.com'
            //    req.session.userid ='65ca28565a04d5362decbbd5'

                next();
            } else {
                next();
            }
            
        }
        else{
            res.redirect('/login')

        }


    } catch (error) {
        console.log(error.message);
    }
}

const islogout=async(req,res,next)=>{

    try {
        if(req.session.user){
           
            res.redirect('/')
           
        }
        else{
            next();
           
        }
    } catch (error) {
        console.log(error.message);
    }
}
const isblock=async(req,res,next)=>{
    if(req.session.user){
     
        const mail= req.session.user
        const blockcheck= await user.findOne({email:mail})
        const check=blockcheck.status

        if(check==='false'){

            res.redirect('/')
        }
        else{
            next();
        }
    }
    else{
        next();
    }


}


module.exports={
    islogin,
    islogout,
    isblock
}