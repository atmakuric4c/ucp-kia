FROM node:14
#ENV TZ=Asia/Kolkata
#RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
WORKDIR /app
RUN apt-get update && curl -sL https://deb.nodesource.com/setup_14.x | bash - && apt-get update && apt-get install vim -y && apt-get install -y build-essential && apt-get install -y nodejs && apt-get install supervisor -y && apt-get install openssh-server -y && echo "root:Docker!" | chpasswd
COPY . .
RUN mkdir -p /var/log/supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY sshd_config /etc/ssh/
##UI
WORKDIR /app/UI/
#RUN a2enmod rewrite
RUN npm install
RUN npm install react-custom-scrollbars --save
RUN npm audit fix
RUN npm run build
RUN mv /app/UI/dist/main.js /app/API/ui/
RUN mv /app/UI/dist/index.html /app/API/ui/
#RUN cp -rf /app/UI/src/css /app/API/ui/src/
RUN cp -rf /app/UI/src/* /app/API/ui/src/
#RUN cp -rf /app/UI/src/img /app/API/ui/src/
#API
WORKDIR /app/API/
RUN npm install
RUN npm audit fix --force
RUN npm install nodemon -g
RUN npm install pm2 -g
RUN pm2 install pm2-logrotate
RUN pm2 set pm2-logrotate:rotateInterval 0 0 * * 0
RUN chmod -R 777 img reports
EXPOSE 80 8080 9891 22 2222
CMD ["/usr/bin/supervisord", "-n"]
