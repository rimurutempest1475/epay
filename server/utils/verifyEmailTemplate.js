const verifyEmailTemplate = ({name,url})=>{
    return`
<p>Dear ${name}</p>    
<p>Cảm ơn đã đăng kí 4U-Cosmetics.</p>   
<a href=${url} style="color:black;background :orange;margin-top : 10px,padding:20px,display:block">
    Xác thực Email
</a>
`
}

export default verifyEmailTemplate