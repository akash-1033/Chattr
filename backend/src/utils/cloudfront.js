import fs from "fs";
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";

const privateKey = process.env.CLOUDFRONT_PRIVATE_KEY.replace(/\\n/g, "\n");
const keyPairId = process.env.CLOUDFRONT_KEYPAIR_ID;
const cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN;

export const generateCloudUrl = (fileKey) => {
  const url = `${cloudFrontDomain}/${fileKey}`;
  return getSignedUrl({
    url,
    keyPairId,
    privateKey,
    dateLessThan: new Date(Date.now() + 60 * 60 * 1000),
  });
};
