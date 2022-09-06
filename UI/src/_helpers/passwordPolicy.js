export var validation = {    
    c4cCheckPasswordPolicy(password, fname, mname, lname, mobile, email, customerName, newCommonWords){    
        let commonWords = ["cloud4c","c4c","ctrls", "ucp", "myshift", "welcome", "password", "admin"];
    
        if(!password || (password && !password.trim())){
            return [0,"Please enter Password"];
        }
        else if(password.length < 14){
            return [0,"Password must contain atleast 14 characters"];
        }
        else if(password.length > 32){
            return[0, "Password must not greater than 32 characters."];
        }
        else if(password.match(/(.*[ .,()%])/)){
            return [0, "Space and . , ( ) % These Special characters are not allowed in Password"];
        }
        else if(!password.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)){
            return [0, "Password must contain atleast one Small and one Capital letter"];
        }
        else if(!password.match(/([0-9])/)){
            return [0, "Password must contain atleast one number"];
        }
        else if(!password.match(/(.*[@,=,!,&,#,$,^,*,?,_,~,-])/)){
            return [0, "Password must contain atleast one special character"];
        }
        else if(!password.match(/[a-z]/gi) || password.match(/[a-z]/gi).length < 3){
            return [0, "Password must contain atleast 3 alphabet characters"];
        }
        else if(mobile && password.toLowerCase().indexOf(mobile.toLowerCase()) != -1){
            return [0, "Password must not contain Mobile Number"];
        }
        else if(mobile && password.toLowerCase().indexOf(mobile.toLowerCase().split('').reverse().join('')) != -1){
            return [0, "Password must not contain reverse of Mobile Number"];
        }
        else if(fname && password.toLowerCase().indexOf(fname.toLowerCase()) != -1){
            return [0, "Password must not contain First Name"];
        }
        else if(fname && password.toLowerCase().indexOf(fname.toLowerCase().split('').reverse().join('')) != -1){
            return [0, "Password must not contain reverse of First Name"];
        }
        else if(mname && password.toLowerCase().indexOf(mname.toLowerCase()) != -1){
            return [0, "Password must not contain Middle Name"];
        }
        else if(mname && password.toLowerCase().indexOf(mname.toLowerCase().split('').reverse().join('')) != -1){
            return [0, "Password must not contain reverse of Middle Name"];
        }
        else if(lname && password.toLowerCase().indexOf(lname.toLowerCase()) != -1){
            return [0, "Password must not contain Last Name"];
        }
        else if((lname && password.toLowerCase().indexOf(lname.toLowerCase().split('').reverse().join('')) != -1)){
            return [0, "Password must not contain reverse of Surname"];
        }
        else if(password.match(/(.)\1{2,}/)){
            return [0, "Password must not contain more than 2 sequential repeated characters"];
        }        
        else if(password.match(/(012|123|234|345|456|567|678|789|890|901)/)){
            return [0, "Password must not contain more than 2 sequential numbers"];
        }
        else if(password.match(/(210|321|433|543|654|765|876|987|098|109)/)){
            return [0, "Password must not contain more than 2 sequential reverse numbers"];
        }
        else if(password.match(/(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|yza|zab|ABC|BCD|CDE|DEF|EFG|FGH|GHI|HIJ|IJK|JKL|KLM|LMN|MNO|NOP|OPQ|PQR|QRS|RST|STU|TUV|UVW|VWX|WXY|XYZ|YZA|ZAB)/)){
            return [0, "Password must not contain more than 2 sequential alphabets"];
        }
        else if(password.match(/(cba|dcb|edc|fed|gfe|hgf|ihg|jih|kji|lkj|mlk|nml|onm|pon|qpo|rqp|srq|tsr|uts|vut|wvu|xwv|yxw|zyx|azy|baz|CBA|DCB|EDC|FED|GFE|HGF|IHG|JIH|KJI|LKJ|MLK|NML|ONM|PON|QPO|RQP|SRQ|TSR|UTS|VUT|WVU|XWV|YXW|ZYX|AZY|BAZ)/)){
            return [0, "Password must not contain more than 2 sequential reverse alphabets"];
        }

        if(fname && fname.split(" ").length > 1){
            fname = fname.split(" ");
            for(let i = 0; i < fname.length; i++){
                if(fname[i] && password.toLowerCase().indexOf(fname[i].toLowerCase()) != -1){
                    return [0, "Password must not contain any common words"];
                }
                else if(fname[i] && password.toLowerCase().indexOf(fname[i].toLowerCase().split('').reverse().join('')) != -1){
                    return [0, "Password must not contain reverse of any common word"];
                }
            }
        }
        
        if(customerName){
            customerName = customerName.split(" ");
            for(let i = 0; i < customerName.length; i++){
                if(customerName[i] && customerName[i].length > 2){
                    if(customerName[i] && password.toLowerCase().indexOf(customerName[i].toLowerCase()) != -1){
                        return [0, "Password must not contain any common words"];
                    }
                    else if(customerName[i] && password.toLowerCase().indexOf(customerName[i].toLowerCase().split('').reverse().join('')) != -1){
                        return [0, "Password must not contain reverse of any common word"];
                    }
                }
            }
        }
    
        if(email){
            email = email.split("@")[0];
            email = email.split(".");
            for(let i = 0; i < email.length; i++){
                if(password.toLowerCase().indexOf(email[i].toLowerCase()) != -1){
                    return [0, "Password must not contain any common word"];
                }
                else if(email[i] && password.toLowerCase().indexOf(email[i].toLowerCase().split('').reverse().join('')) != -1){
                    return [0, "Password must not contain reverse of any common word"];
                }
            }
        }
        
        for(let i = 0; i < commonWords.length; i++){
            if(password.toLowerCase().indexOf(commonWords[i].toLowerCase()) != -1){
                return [0, "Password must not contain any common word"];
            }
            else if(commonWords[i] && password.toLowerCase().indexOf(commonWords[i].toLowerCase().split('').reverse().join('')) != -1){
                return [0, "Password must not contain reverse of any common word"];
            }
        }
    
        if(newCommonWords){
            for(let i = 0; i < newCommonWords.length; i++){
                if(password.toLowerCase().indexOf(newCommonWords[i].toLowerCase()) != -1){
                    return [0, "Password must not contain any common word"];
                }
                else if(newCommonWords[i] && password.toLowerCase().indexOf(newCommonWords[i].toLowerCase().split('').reverse().join('')) != -1){
                    return [0, "Password must not contain reverse of any common word"];
                }
            }
        }
    
        return [1];
    },
    generateNumber(maxNum){
        return Math.floor((Math.random() * maxNum) + 1);
    },
    generatePassword(){
        let chars = {
            0: ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'],
            1: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'],
            2: [0,1,2,3,4,5,6,7,8,9],
            3: ['!','@','#','$','^','*','-','_','+']
        }

        let password = "";

        for(let i = 0; i <  4; i++){
            password += chars[1][this.generateNumber(chars[1].length-1)];
            password += chars[0][this.generateNumber(chars[0].length-1)];
            password += chars[2][this.generateNumber(chars[2].length-1)];
            password += chars[0][this.generateNumber(chars[0].length-1)];
            password += chars[3][this.generateNumber(chars[3].length-1)];
        }

        return password;
    },
}