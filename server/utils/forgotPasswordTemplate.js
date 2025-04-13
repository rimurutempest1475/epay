const forgotPasswordTemplate = ({ name, otp })=>{
    return `
<div>
    <p>Dear, ${name}</p>
    <p>Bạn vừa yêu cầu đổi mật khẩu. Vui lòng sử dụng OTP dưới đây để đổi mật khẩu.</p>
    <div style="background:yellow; font-size:20px;padding:20px;text-align:center;font-weight : 800;">
        ${otp}
    </div>
    <p>Mã OTP này chỉ khả dụng trong 1 giờ đồng hồ.</p>
    <br/>
    </br>
    <p>Thanks</p>
    <p>4U Cosmetics</p>
</div>
    `
}

export default forgotPasswordTemplate