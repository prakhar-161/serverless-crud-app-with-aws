const AWS = require('aws-sdk');

AWS.config.update({
    region: 'ap-south-1' 
});

const dynamo = new AWS.DynamoDB.DocumentClient();
const dynamoDBTableName = 'users';
// const userPath = '/users';

exports.handler = async (event) => {
    let response;
    console.log(event);
    switch(event.httpMethod) {
        case "POST":
            response = await saveUser(JSON.parse(event.body));
            break;
        case "GET":
            response = await getUsers();
            break;
        case "PUT":
            // id, event keyToBeUpdated, key's updatedValue
            const reqBody = JSON.parse(event.body);
            response = await updateUser(reqBody.id, reqBody.updateKey, reqBody.updateKeyValue);
            break;
        case "DELETE":
            response = await deleteUser(JSON.parse(event.body).id);
            break;
        default: 
            response = buildResponse(404, '404 Not Found');
    }
    return response;
};

function saveUser(reqBody) {
    const params = {
        TableName: dynamoDBTableName,
        Item: reqBody
    };
    return dynamo.put(params).promise().then(() => {
        const body = {
            Operation: 'SAVE',
            Message: 'SUCCESS',
            Item: reqBody
        }
        return buildResponse(200, body);
    }, (error) => {
        console.log(error);
    });
};

async function getUsers() {
    const params = {
        TableName: dynamoDBTableName,
    };
    const allUsers = await dynamo.scan(params).promise();
    const body = {
        users: allUsers  
    };
    return buildResponse(200, body);
};

function updateUser(id, updateKey, updateKeyValue) {
    const params = {
        TableName: dynamoDBTableName,
        Key: {
            'id': id,
        },
        UpdateExpression: `set ${updateKey} = :value`,
        ExpressionAttributeValues: {
            ':value': updateKeyValue 
        },
        returnValues: 'UPDATED_NEW'
    };
    
    return dynamo.update(params).promise().then(() => {
        const body = {
            Operation: 'UPDATE',
            Message: 'SUCCESS',
            // Item: response
        };
        return buildResponse(200, body);
    }, (error) => {
        console.log(error);
    });
};

function deleteUser(id) {
    const params = {
        TableName: dynamoDBTableName,
        Key: {
           'id': id 
        },
        returnValues: "ALL_OLD"
    };
    return dynamo.delete(params).promise().then(() => {
        const body = {
            Operation: 'DELETE',
            Message: 'SUCCESS',
            // Item: response
        };
        return buildResponse(200, body);
    }, (error) => {
        console.log(error);
    });
};

function buildResponse(statusCode, body) {
    return {
        statusCode: statusCode,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    };
};