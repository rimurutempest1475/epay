export const DisplayPriceInRupees = (price) => {  
    return new Intl.NumberFormat('vi-VN', { // Sử dụng locale 'vi-VN' cho tiếng Việt  
        style: 'currency',  
        currency: 'VND', // Đặt currency là 'VND'  
        minimumFractionDigits: 0, // Không hiển thị phần thập phân  
    }).format(price);  
};  