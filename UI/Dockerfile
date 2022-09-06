FROM php:7.2-apache
ENV TZ=Asia/Kolkata
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
WORKDIR  /var/www/html/
#RUN https://deb.nodesource.com/setup_14.x | bash - && apt-get update && apt-get install -y build-essential && apt-get install -y nodejs && apt-get install openssh-server -y && echo "root:Docker!" | chpasswd
RUN apt-get update && curl -sL https://deb.nodesource.com/setup_14.x | bash - && apt-get update && apt-get install vim -y && apt-get install -y build-essential && apt-get install -y nodejs && apt-get install supervisor -y && apt-get install openssh-server -y && echo "root:Docker!" | chpasswd
COPY . .
COPY sshd_config /etc/ssh/
RUN a2enmod rewrite
RUN npm install
RUN npm install react-custom-scrollbars --save
RUN npm audit fix
RUN npm run build
RUN mv /var/www/html/dist/main.js /var/www/html/
RUN mv /var/www/html/dist/index.html /var/www/html/
#RUN mv /var/www/html/src /var/www/html/
RUN chmod 0777 /var/www/html/main.js
RUN chmod 0777 /var/www/html/index.html
RUN chmod -R 0777 /var/www/html/src
EXPOSE 22 80 2222
#CMD ["/usr/sbin/sshd", "-D"]
CMD ["/usr/bin/supervisord"]