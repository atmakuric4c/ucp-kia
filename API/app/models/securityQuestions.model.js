const db = require("../../config/database");
const dbHandler= require('../../config/api_db_handler');

const securityQuestionsModel = {
    getSecurityQuestions: getSecurityQuestions,
    getUserSecurityQuestions: getUserSecurityQuestions,
    addUserSecurityQuestions: addUserSecurityQuestions,
    updateUserSecurityQuestions: updateUserSecurityQuestions,
    getRandomUserSecurityQuestions: getRandomUserSecurityQuestions,
    verifyUserSecurityQuestions: verifyUserSecurityQuestions
}

async function getSecurityQuestions(req) {
  
    let { set, limit } = req.query;
    let offset = '';
    let values = {};

    if(set && limit){
        offset = ` limit :offset, :limit`;
        values = { offset: parseInt((set - 1) * limit), limit: parseInt(limit) }
    }

    let sql = `select question_id, question from c4_questions${offset}`
    let sql_count = `select count(*) as count from c4_questions`;

    let list = await dbHandler.executeQueryv2(sql, values );
    let count = await dbHandler.executeQueryv2(sql_count, null );

    let response = { output : list, count: count.length ? count[0]['count'] : 0 };
    return response;
  
}


async function getUserSecurityQuestions(req) {

    let { clientid } = req;
    let userid = req.query.user_id
    let sql = `select qa.question_id, q.question, qa.answer, qa.status from c4_client_question_ans as qa left join c4_questions as q on qa.question_id = q.question_id where qa.user_id = :userid and qa.client_id = :clientid and status = 1`;
    let list = await dbHandler.executeQueryv2(sql, { userid: userid, clientid: clientid } );

    let response = { output : list, count: list.length };
    return response;

}

async function addUserSecurityQuestions(req) {

    let { clientid } = req;
    let userid = req.body.user_id;
    console.log(req.body)
    for(let single_question of req.body.questions){

        let question_query = `select question from c4_questions where question_id = :question_id`
        let question_name = await dbHandler.executeQueryv2(question_query, { question_id: single_question.question_id } );
        if(!question_name.length) throw ({ type: "custom", message: `question not found`, status: 404 });

        let question_ans_query = `select * from c4_client_question_ans where user_id = :userid and client_id = :clientid and question_id = :question_id and status = 1`
        let question = await dbHandler.executeQueryv2(question_ans_query, { userid: userid, clientid: clientid, question_id: single_question.question_id } )

        if(question.length){
           
            question_name = question_name.length ? question_name[0]['question'] : ''; 
            throw ({ type: "custom", message: `question '${question_name}' is already selected`, status: 400 });
        }
    }

    let sql = `insert into c4_client_question_ans(client_id, user_id, question_id, answer, status, created_at, created_by, updated_at, updated_by ) values 
                (:clientid, :userid, :question_id, :answer, :status, :created_at, :created_by, :updated_at, :updated_by )`;

    for(let single_question of req.body.questions){

        let new_element = {};

        new_element.userid = userid, 
        new_element.clientid = clientid, 
        new_element.question_id = single_question.question_id, 
        new_element.answer = single_question.answer, 
        new_element.status = 1, 
        new_element.created_at = new Date(),
        new_element.created_by = userid,
        new_element.updated_at = new Date(),
        new_element.updated_by = userid

        await dbHandler.executeQueryv2(sql, new_element );
    }

    let update_status_query = `update c4_client_users set security_question_enable = :security_question_status where id = :userid`;
    let update_status = await dbHandler.executeQueryv2(update_status_query, { security_question_status: 1, userid: userid } );

    let response = { output : req.body, count: req.body.length };
    return response;

}


async function updateUserSecurityQuestions(req) {

    let { clientid } = req;
    let userid = req.body.user_id
    for(let single_question of req.body.questions){

        let question_query = `select question from c4_questions where question_id = :question_id`
        let question_name = await dbHandler.executeQueryv2(question_query, { question_id: single_question.question_id } );
        if(!question_name.length) throw ({ type: "custom", message: `question not found`, status: 404 });
    }

    let delete_old_questions_query = 'delete from c4_client_question_ans where client_id = :clientid and user_id = :userid';
    let delete_old_questions = await dbHandler.executeQueryv2(delete_old_questions_query, { clientid: clientid, userid: userid } );


    let sql = `insert into c4_client_question_ans(client_id, user_id, question_id, answer, status, created_at, created_by, updated_at, updated_by ) values 
    (:clientid, :userid, :question_id, :answer, :status, :created_at, :created_by, :updated_at, :updated_by )`;

    for(let single_question of req.body.questions){

        let new_element = {};

        new_element.userid = userid, 
        new_element.clientid = clientid, 
        new_element.question_id = single_question.question_id, 
        new_element.answer = single_question.answer, 
        new_element.status = 1, 
        new_element.created_at = new Date(),
        new_element.created_by = userid,
        new_element.updated_at = new Date(),
        new_element.updated_by = userid

        await dbHandler.executeQueryv2(sql, new_element );
    }

    let response = { output : req.body, count: req.body.length };
    return response;

}


async function getRandomUserSecurityQuestions(req) {

    let { hash_key } = req.params;
    let random_questions = [];
    let random_index = [];
    let output = {};

    let verify_user_query = 'select * from c4_client_users where hash_key = :hash_key';
    let verify_user = await dbHandler.executeQueryv2(verify_user_query, { hash_key: hash_key } );
    if(!verify_user.length) throw ({ type: "custom", message: `user not found`, status: 404 });

    if(verify_user[0]['security_question_enable']){

        let sql = `select qa.question_id, q.question from c4_client_question_ans as qa left join c4_questions as q on qa.question_id = q.question_id where qa.user_id = :userid`;
        let list = await dbHandler.executeQueryv2(sql, { userid: verify_user[0]['id'] } );

        for(let i = 0; i < 2; i++){

            let already = false;

            while(!already){
                let new_index = Math.floor(Math.random() * list.length);
                if(!random_index.includes(new_index)){
                    already = true;
                    random_index.push(new_index);
                }   
            }
            
        }

        random_index.forEach(single_index => {
            random_questions.push(list[single_index]);
        });
    }

    output.security_question_enable = verify_user[0]['security_question_enable']
    output.questions = random_questions;


    let response = { output : output, count: random_questions.length };
    return response;

}

async function verifyUserSecurityQuestions(req) {

    let { hash_key } = req.params;
    let output = {};

    let verify_user_query = 'select * from c4_client_users where hash_key = :hash_key';
    let verify_user = await dbHandler.executeQueryv2(verify_user_query, { hash_key: hash_key } );
    if(!verify_user.length) throw ({ type: "custom", message: `user not found`, status: 404 });

    if(verify_user[0]['security_question_enable']){  
    
        for(let single_ans of req.body){
            let verify_ans_query = `select * from c4_client_question_ans where user_id = :userid and question_id = :question_id and answer = :answer`;
            let verify_ans = await dbHandler.executeQueryv2(verify_ans_query, { userid: verify_user[0]['id'], question_id: single_ans.question_id, answer: single_ans.answer } );

            if(!verify_ans.length)  return { output : false, count: 0 };
        }
    }

    output.security_question_enable = verify_user[0]['security_question_enable']
    output.questions = [];

    let response = { output: output, count: 0 };
    return response;

}



module.exports = securityQuestionsModel;