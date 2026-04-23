export const isAdminAuth=(req,res,next)=>{
    if(!req.session.adminId){
        return res.render("admin/login.ejs",{ errors: null })
    }
    next()
}

export const isAdminNotAuth=(req,res,next)=>{
    if(!req.session.adminId){
        next()

    }
    else{
        res.redirect("/admin/dashboard")
    }
}