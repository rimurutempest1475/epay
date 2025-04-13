// vnpayController.js (ESM)  

import crypto from "crypto"  
import qs from "qs"  
import dateFormat from "dateformat"  


/**  
 * Tạo link thanh toán VNPAY  
 */  
export async function createVnpayPaymentUrl(req, res) {  
  try {  
    // Lấy config từ .env  
    const vnpUrl = process.env.VNPAY_URL  
    const returnUrl = process.env.VNPAY_RETURN_URL  
    const tmnCode = process.env.VNPAY_TMN_CODE  
    const hashSecret = process.env.VNPAY_HASH_SECRET  

    // Lấy thông tin từ body request  
    const { list_items, addressId, subTotalAmt, totalAmt } = req.body  
    // client ip
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress  
    // (1) Tùy nhu cầu, bạn có thể lưu đơn hàng tạm vào DB, sinh orderId...  
    const orderId = "ORDER-" + Date.now()  

    // Tạo timestamp (yyyyMMddHHmmss)  
    const createDate = dateFormat(new Date(), "yyyymmddHHMMss")  

    // Dữ liệu gửi VNPAY  
    let vnpParams = {  
      vnp_Version: "2.1.0",  
      vnp_Command: "pay",  
      vnp_TmnCode: tmnCode,  
      vnp_Locale: "vn",  
      vnp_CurrCode: "VND",  
      vnp_TxnRef: orderId,  
      vnp_OrderInfo: `Thanh toan don hang #${orderId}`,  
      vnp_OrderType: "other",  
      vnp_Amount: totalAmt * 100, // VNPAY yêu cầu nhân 100  
      vnp_ReturnUrl: returnUrl,  
      vnp_CreateDate: createDate,  
      vnp_IpAddr: clientIp, 
      vnp_SecureHashType : "SHA512"
    }  

    // Hàm sắp xếp key theo alpha  
    const sortObject = (obj) => {  
      const sorted = {}  
      const keys = Object.keys(obj).sort()  
      keys.forEach((key) => {  
        sorted[key] = obj[key]  
      })  
      return sorted  
    }  

    vnpParams = sortObject(vnpParams)  
    const signData = qs.stringify(vnpParams, { encode: false })  
    const hmac = crypto.createHmac("sha512", hashSecret)  
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex")  
    vnpParams.vnp_SecureHash = signed  

    // Tạo paymentUrl = vnpUrl + "?" + params  
    const paymentUrl = vnpUrl + "?" + qs.stringify(vnpParams, { encode: true })  

    // Gửi link về cho frontend  
    return res.json({ paymentUrl })  
  } catch (error) {  
    console.error("Error:", error)  
    return res.status(500).json({  
      success: false,  
      message: "Không thể tạo paymentUrl",  
      error: error.message,  
    })  
  }  
}  

/**  
 * Xử lý kết quả thanh toán (Return URL)  
 */  
export async function vnpayReturn(req, res) {  
  try {  
    const hashSecret = process.env.VNPAY_HASH_SECRET  
    let vnpParams = req.query  
    const secureHash = vnpParams["vnp_SecureHash"]  
    delete vnpParams["vnp_SecureHash"]  

    // Sắp xếp keys vnpParams  
    const sortObject = (obj) => {  
      const sorted = {}  
      const keys = Object.keys(obj).sort()  
      keys.forEach((key) => {  
        sorted[key] = obj[key]  
      })  
      return sorted  
    }  
    vnpParams = sortObject(vnpParams)  

    // Tạo signData & verify  
    const signData = qs.stringify(vnpParams, { encode: false })  
    const hmac = crypto.createHmac("sha512", hashSecret)  
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex")  

    if (secureHash === signed) {  
      // Chữ ký OK => Kiểm tra mã phản hồi  
      const responseCode = vnpParams["vnp_ResponseCode"] // "00" = thành công  
      if (responseCode === "00") {  
        // TODO: cập nhật trạng thái đơn hàng = "paid"  
        return res.send("Thanh toán VNPay thành công. Cảm ơn bạn!")  
      } else {  
        // Thanh toán ko thành công  
        return res.send("Giao dịch thất bại hoặc bị hủy.")  
      }  
    } else {  
      // Sai chữ ký  
      return res.status(400).send("Invalid signature.")  
    }  
  } catch (error) {  
    console.error("vnpayReturn error:", error)  
    return res.status(500).send("Không thể xử lý kết quả thanh toán")  
  }  
}  