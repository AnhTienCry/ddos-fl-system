# Tối ưu: Dùng alpine và chỉ cài dependencies cần thiết
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Cài đặt dependencies và xóa cache
RUN npm install --no-audit --no-fund && \
    npm cache clean --force

# Copy source code
COPY . .

EXPOSE 3000

# Development mode (có thể build production sau)
CMD ["npm", "start"]