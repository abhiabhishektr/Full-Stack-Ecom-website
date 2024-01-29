const user = require("../model/usermodel");
const islogin=async(req,res,next)=>{
    try {
        
        if(req.session.user || process.env.NODE_ENV ){
            if (process.env.NODE_ENV === 'test') {
                req.session.user = 'abhishekabtr@gmail.com'
                req.session.userid = '659640d89109598e3af4385d'
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