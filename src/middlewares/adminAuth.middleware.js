export const isAdminAuth=(req,res,next)=>{
    if(!req.session.adminId){
        return res.render("/admin/login")
    }
    next()
}