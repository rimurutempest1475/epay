import crypto from 'crypto';

const config = {
    partnerCode: process.env.MOMO_PARTNER_CODE,
    accessKey: process.env.MOMO_ACCESS_KEY,
    secretKey: process.env.MOMO_SECRET_KEY,
    endpoint: "https://test-payment.momo.vn/v2/gateway/api/create",
    redirectUrl: "http://localhost:3000/order/success",
    ipnUrl: "http://localhost:8080/api/order/momo-webhook",
};

export const createMoMoSignature = (rawSignature) => {
    return crypto
        .createHmac('sha256', config.secretKey)
        .update(rawSignature)
        .digest('hex');
};

export default config; 