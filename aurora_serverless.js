'use strict';

import * as AWS from "aws-sdk";

exports.handler = function (event, context, callback)
{
    setupWatchdogTimer(event, context, callback);

    console.log('Request received:\n' + JSON.stringify(event));

    let message;

    switch(event.RequestType)
    {
        case 'Create':
            console.log('Create resource');
            doCreateAuroraServerless(event, context);
            message = 'Resource creation successful';
            break;
        case 'Update':
            console.log('Update resource');
            doUpdateAuroraServerless(event, context);
            message = 'Resource update successful';
            break;
        case 'Delete':
            console.log('Delete resource');
            doDeleteAuroraServerless(event, context);
            message = 'Resource deletion successful';
            break;
        default:
            console.log('Unknown request type');
            sendResponse(event, context, 'FAILED', { 'Message': 'Unknown request type' });
            return;
    }
//    sendResponse(event, context, 'SUCCESS', { 'Message': message });
};

function resolveBoolean(value)
{
    const booleanTrue  = new RegExp('^(y|Y|yes|Yes|YES|true|True|TRUE|on|On|ON)$');
    const booleanFalse = new RegExp('^(n|N|no|No|NO|false|False|FALSE|off|Off|OFF)$');

    if (booleanTrue.test(value))
    {
        return true;
    }
    if (booleanFalse.test(value))
    {
        return false;
    }
    return value;
}

function doCreateAuroraServerless(event, context)
{
    // Resolve boolean values
    if (typeof event.ResourceProperties.EngineIAMDatabaseAuthentication === 'string')
    {
        event.ResourceProperties.EngineIAMDatabaseAuthentication = resolveBoolean(event.ResourceProperties.EngineIAMDatabaseAuthentication);
    }
    if (typeof event.ResourceProperties.StorageEncrypted === 'string')
    {
        event.ResourceProperties.StorageEncrypted = resolveBoolean(event.ResourceProperties.StorageEncrypted);
    }
    if (typeof event.ResourceProperties.ScalingConfiguration !== 'undefined')
    {
        if (typeof event.ResourceProperties.ScalingConfiguration.AutoPause === 'string')
        {
            event.ResourceProperties.ScalingConfiguration.AutoPause = resolveBoolean(event.ResourceProperties.ScalingConfiguration.AutoPause);
        }
    }

    let rds = new AWS.RDS();
    let options = {
        DBClusterIdentifier:             event.ResourceProperties.DBClusterIdentifier,
        Engine:                          event.ResourceProperties.Engine || 'aurora',
        BackupRetentionPeriod:           event.ResourceProperties.BackupRetentionPeriod || 1,
        EngineMode:                      'serverless',
        ScalingConfiguration:            event.ResourceProperties.ScalingConfiguration || {
            AutoPause:             true,
            MaxCapacity:           2,
            MinCapacity:           2,
            SecondsUntilAutoPause: 300
        },
        StorageEncrypted:                typeof event.ResourceProperties.StorageEncrypted !== 'undefined' ? event.ResourceProperties.StorageEncrypted : true
    };

    if (event.ResourceProperties.AvailabilityZones)
    {
        options.AvailabilityZones = event.ResourceProperties.AvailabilityZones;
    }
    if (event.ResourceProperties.CharacterSetName)
    {
        options.CharacterSetName = event.ResourceProperties.CharacterSetName;
    }
    if (event.ResourceProperties.DBClusterParameterGroupName)
    {
        options.DBClusterParameterGroupName = event.ResourceProperties.DBClusterParameterGroupName;
    }
    if (event.ResourceProperties.DBSubnetGroupName)
    {
        options.DBSubnetGroupName = event.ResourceProperties.DBSubnetGroupName;
    }
    if (event.ResourceProperties.DatabaseName)
    {
        options.DatabaseName = event.ResourceProperties.DatabaseName;
    }
    if (event.ResourceProperties.EnableCloudwatchLogsExports)
    {
        options.EnableCloudwatchLogsExports = event.ResourceProperties.EnableCloudwatchLogsExports;
    }
    if (event.ResourceProperties.EngineVersion)
    {
        options.EngineVersion = event.ResourceProperties.EngineVersion;
    }
    if (event.ResourceProperties.KmsKeyId)
    {
        options.KmsKeyId = event.ResourceProperties.KmsKeyId;
    }
    if (event.ResourceProperties.MasterUserPassword)
    {
        options.MasterUserPassword = event.ResourceProperties.MasterUserPassword;
    }
    if (event.ResourceProperties.MasterUsername)
    {
        options.MasterUsername = event.ResourceProperties.MasterUsername;
    }
    if (event.ResourceProperties.OptionGroupName)
    {
        options.OptionGroupName = event.ResourceProperties.OptionGroupName;
    }
    if (event.ResourceProperties.Port)
    {
        options.Port = event.ResourceProperties.Port;
    }
    if (event.ResourceProperties.PreSignedUrl)
    {
        options.PreSignedUrl = event.ResourceProperties.PreSignedUrl;
    }
    if (event.ResourceProperties.PreferredBackupWindow)
    {
        options.PreferredBackupWindow = event.ResourceProperties.PreferredBackupWindow;
    }
    if (event.ResourceProperties.PreferredMaintenanceWindow)
    {
        options.PreferredMaintenanceWindow = event.ResourceProperties.PreferredMaintenanceWindow;
    }
    if (event.ResourceProperties.ReplicationSourceIdentifier && event.ResourceProperties.SourceRegion)
    {
        options.ReplicationSourceIdentifier = event.ResourceProperties.ReplicationSourceIdentifier;
        options.SourceRegion                = event.ResourceProperties.SourceRegion;
    }
    if (event.ResourceProperties.Tags)
    {
        options.Tags = event.ResourceProperties.Tags;
    }
    if (event.ResourceProperties.VpcSecurityGroupIds)
    {
        options.VpcSecurityGroupIds = event.ResourceProperties.VpcSecurityGroupIds;
    }

    rds.createDBCluster(
        options,
        function (err, data)
        {
            if (err !== null)
            {
                console.log('rds.createDBCluster failed');
                sendResponse(event, context, 'FAILED', err);
            }
            else
            {
                console.log('rds.createDBCluster succeeded');
                sendResponse(event, context, 'SUCCESS', data);
            }
        }
    );
}

function doUpdateAuroraServerless(event, context)
{
    sendResponse(event, context, 'FAILED', { 'Message': 'Updates not implemented' });
}

function doDeleteAuroraServerless(event, context)
{
    if (typeof event.ResourceProperties.SkipFinalSnapshot === 'string')
    {
        event.ResourceProperties.SkipFinalSnapshot = resolveBoolean(event.ResourceProperties.SkipFinalSnapshot);
    }

    let rds = new AWS.RDS();
    let options = {
        DBClusterIdentifier: event.ResourceProperties.DBClusterIdentifier,
        SkipFinalSnapshot:   typeof event.ResourceProperties.SkipFinalSnapshot !== 'undefined' ? event.ResourceProperties.SkipFinalSnapshot : true
    };
    if (event.ResourceProperties.SkipFinalSnapshot === false && event.ResourceProperties.FinalDBSnapshotIdentifier)
    {
        options.FinalDBSnapshotIdentifier = event.ResourceProperties.FinalDBSnapshotIdentifier;
    }

    rds.deleteDBCluster(
        options,
        function (err, data)
        {
            if (err !== null)
            {
                sendResponse(event, context, 'FAILED', err);
            }
            else
            {
                sendResponse(event, context, 'SUCCESS', data);
            }
        }
    );

}

function setupWatchdogTimer(event, context, callback)
{
    console.log('Setting timeout to ' + context.getRemainingTimeInMillis() +'ms');
    console.log('Setting timeout callback to ' + callback);
    const timeoutHandler = () => {

        console.log('Timeout failure');

        new Promise(
            () => sendResponse(event, context, 'FAILED', { 'Message': 'Timeout' })
                .then(
                    () => callback(new Error('Function timed out'))
                )
        );
    };

    setTimeout(timeoutHandler, context.getRemainingTimeInMillis() - 1000);
}

function sendResponse(event, context, responseStatus, responseData)
{
    console.log('Sending response: ' + responseStatus);

    let responseBody = JSON.stringify(
        {
            Status:             responseStatus,
            Reason:             'See the details in CloudWatch Log Stream: ' + context.logStreamName,
            PhysicalResourceId: context.logStreamName,
            StackId:            event.StackId,
            RequestId:          event.RequestId,
            LogicalResourceId:  event.LogicalResourceId,
            Data:               responseData
        }
    );

    console.log('Response body:\n', responseBody);

    let https = require('https');
    let url   = require('url');

    let parsedUrl = url.parse(event.ResponseURL);

    let options = {
        hostname: parsedUrl.hostname,
        port:     443,
        path:     parsedUrl.path,
        method:   'PUT',
        headers:  {
            'content-type':   '',
            'content-length': responseBody.length
        }
    };

    console.log('Sending response\n');

    let request = https.request(
        options,
        function (response)
        {
            console.log('Status: ' + response.statusCode);
            console.log('Headers: ' + JSON.stringify(response.headers));
            // Tell AWS Lambda that the function execution is done
            context.done();
        }
    );

    request.on(
        'error',
        function (error)
        {
            console.log('sendResponse error: ' + error);
            // Tell AWS Lambda that the function execution is done
            context.done();
        }
    );

    request.write(responseBody);
    request.end();
}