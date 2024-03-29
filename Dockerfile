FROM ubuntu

ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /home

RUN apt-get update && apt-get install -y --no-install-recommends \
	sudo\
    git\
    curl\
    screen\
    wget\
    apt-transport-https\
    ca-certificates\
    lsb-release\
    && \
apt-get clean

RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

RUN mkdir /home/ilikauploadermanager
COPY ./* /home/ilikauploadermanager/
WORKDIR /home/ilikauploadermanager
RUN npm install react-scripts --force
RUN npm install --force
RUN npm install -g pm2
RUN npm install serve -g
RUN chmod 777 ./*
