import crypto from 'crypto';

export async function generateFileHash(file) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    
    // If file is already Buffer/String
    if (Buffer.isBuffer(file) || typeof file === 'string') {
      hash.update(file);
      resolve(hash.digest('hex'));
      return;
    }

    // If file is File/Blob object
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = Buffer.from(reader.result);
      hash.update(buffer);
      resolve(hash.digest('hex')); 
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
