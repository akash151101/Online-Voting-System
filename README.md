# Online Voting System
This Online Voting system will manage the Voter’s information by which voter can login and use his voting rights. The system will incorporate all features of  Voting system.  

## Purpose of this Project
* Maintaining centralized database of enrolled voters, the primary key of which is a unique national ID stored in the database. The Administrator is the control of the website 

* Time saving , Work loading reduced, information available at time and it provide security for the data.

* The main concept of this project is to build a website, which should be able to allow people to cast their vote by online.
 

## Description

Online Voting System is an online voting technique. It is based on the other online services like Online Reservation System .In this system people who have citizenship of India and whose age is above 18 years of any sex can give his\her vote online without going to any polling booth. There is a Database which is maintained by the ELECTION COMMISION OF INDIA in which all the names of voter with complete information is stored. The Proposed System has the voting system and the counting procedure computerized. The system has ability to perform the voting procedure in less time, reduces the error possibility and the will not accept the invalid votes.

## Screenshots
![Admin Page](https://github.com/akash151101/Online-Voting-System/blob/master/Images/Admin%20Page.JPG)

![Admin Page1](https://github.com/akash151101/Online-Voting-System/blob/master/Images/Admin%20Page1.JPG)

![Analysis Page](https://github.com/akash151101/Online-Voting-System/blob/master/Images/Analysis%20Page.JPG)

![Authentication Page](https://github.com/akash151101/Online-Voting-System/blob/master/Images/Authentication%20Page.JPG)

![Edit Candidate Page](https://github.com/akash151101/Online-Voting-System/blob/master/Images/Edit%20Candidate%20Page.JPG)

![Home Page](https://github.com/akash151101/Online-Voting-System/blob/master/Images/Home%20Page.JPG)

![Login Page](https://github.com/akash151101/Online-Voting-System/blob/master/Images/Login%20Page.JPG)

## Run Locally

### 1. Clone repo

```
$ gh repo clone akash151101/Online-Voting-System
$ cd Online-Voting-System
```

### 2. Install MongoDB

Download it from here: https://docs.mongodb.com/manual/administration/install-community/

### 3. Run Backend

```
$ npm install
$ nodemon app.js
```

### 4. Create Admin User

- Run this on chrome: http://localhost:3000/adminLogin
- It returns admin email and password
- email: test@gmail.com
- password: test

### 5. Login

- Run http://localhost:3000/login
- Enter admin email and password and click signin

