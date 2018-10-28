# Aurora Serverless
Create an [AWS RDS Aurora Serverless](https://aws.amazon.com/rds/aurora/serverless/) instance in [AWS](https://aws.amazon.com/) (as [CloudFormation](https://aws.amazon.com/cloudformation) does not currently support Aurora Serverless creation).

## About
This is a simple [serverless framework](https://serverless.com/) service to create and delete an Aurora Serverless RDS instance.

Before using this in any sort of production environment, please be aware that I am far from an expert with [Node.js](https://nodejs.org/) as I am a PHP devloper by trade.  This is also my first attempt at using [serverless framework](https://serverless.com/), so it is likely to be inefficient and contain errors.

## Installation
1) Clone this repository
1) Run `serverless deploy`

## Usage
Aurora Serverless must be created in a VPC, so your `serverless.yml` file will need to know about the VPC.

<details>
<summary>I've used the following snippet to establish a VPC as part of the serverless deployment</summary>
<p>

```yml
resources:
  Resources:
    VPC:
      Type: AWS::EC2::VPC
      Properties:
        CidrBlock: 10.128.0.0/16
        EnableDnsSupport: true
        EnableDnsHostnames: true
        InstanceTenancy: default
    InternetGateway:
      Type: AWS::EC2::InternetGateway
    InternetGatewayAttachment:
        Type: AWS::EC2::VPCGatewayAttachment
        Properties:
          InternetGatewayId:
            Ref: InternetGateway
          VpcId:
            Ref: VPC
    PublicSubnet1:
      Type: AWS::EC2::Subnet
      Properties:
        VpcId:
          Ref: VPC
        AvailabilityZone:
          "Fn::Select":
            - 0
            - "Fn::GetAZs": ''
        CidrBlock: 10.128.1.0/24
        MapPublicIpOnLaunch: true
    PublicSubnet2:
      Type: AWS::EC2::Subnet
      Properties:
        VpcId:
          Ref: VPC
        AvailabilityZone:
          "Fn::Select":
          - 1
          - "Fn::GetAZs": ''
        CidrBlock: 10.128.2.0/24
        MapPublicIpOnLaunch: true
    PrivateSubnet1:
      Type: AWS::EC2::Subnet
      Properties:
        VpcId:
          Ref: VPC
        AvailabilityZone:
          "Fn::Select":
          - 0
          - "Fn::GetAZs": ''
        CidrBlock: 10.128.128.0/24
        MapPublicIpOnLaunch: false
    PrivateSubnet2:
      Type: AWS::EC2::Subnet
      Properties:
        VpcId:
          Ref: VPC
        AvailabilityZone:
          "Fn::Select":
          - 1
          - "Fn::GetAZs": ''
        CidrBlock: 10.128.129.0/24
        MapPublicIpOnLaunch: false
    NatGateway1EIP:
      Type: AWS::EC2::EIP
      DependsOn: InternetGatewayAttachment
      Properties:
        Domain: vpc
    NatGateway2EIP:
      Type: AWS::EC2::EIP
      DependsOn: InternetGatewayAttachment
      Properties:
        Domain: vpc
    NatGateway1:
      Type: AWS::EC2::NatGateway
      Properties:
        AllocationId:
          "Fn::GetAtt": NatGateway1EIP.AllocationId
        SubnetId:
          Ref: PublicSubnet1
    NatGateway2:
      Type: AWS::EC2::NatGateway
      Properties:
        AllocationId:
          "Fn::GetAtt": NatGateway2EIP.AllocationId
        SubnetId:
          Ref: PublicSubnet2
    PublicRouteTable:
      Type: AWS::EC2::RouteTable
      Properties:
        VpcId:
          Ref: VPC
    DefaultPublicRoute:
      Type: AWS::EC2::Route
      DependsOn: InternetGatewayAttachment
      Properties:
        RouteTableId:
          Ref: PublicRouteTable
        DestinationCidrBlock: 0.0.0.0/0
        GatewayId:
          Ref: InternetGateway
    PublicSubnet1RouteTableAssociation:
      Type: AWS::EC2::SubnetRouteTableAssociation
      Properties:
        RouteTableId:
          Ref: PublicRouteTable
        SubnetId:
          Ref: PublicSubnet1
    PublicSubnet2RouteTableAssociation:
      Type: AWS::EC2::SubnetRouteTableAssociation
      Properties:
        RouteTableId:
          Ref: PublicRouteTable
        SubnetId:
          Ref: PublicSubnet2
    PrivateRouteTable1:
      Type: AWS::EC2::RouteTable
      Properties:
        VpcId:
          Ref: VPC
    DefaultPrivateRoute1:
      Type: AWS::EC2::Route
      Properties:
        RouteTableId:
          Ref: PrivateRouteTable1
        DestinationCidrBlock: 0.0.0.0/0
        NatGatewayId:
          Ref: NatGateway1
    PrivateSubnet1RouteTableAssociation:
      Type: AWS::EC2::SubnetRouteTableAssociation
      Properties:
        RouteTableId:
          Ref: PrivateRouteTable1
        SubnetId:
          Ref: PrivateSubnet1
    PrivateRouteTable2:
      Type: AWS::EC2::RouteTable
      Properties:
        VpcId:
          Ref: VPC
    DefaultPrivateRoute2:
      Type: AWS::EC2::Route
      Properties:
        RouteTableId:
          Ref: PrivateRouteTable2
        DestinationCidrBlock: 0.0.0.0/0
        NatGatewayId:
          Ref: NatGateway2
    PrivateSubnet2RouteTableAssociation:
      Type: AWS::EC2::SubnetRouteTableAssociation
      Properties:
        RouteTableId:
          Ref: PrivateRouteTable2
        SubnetId:
          Ref: PrivateSubnet2
    NoIngressSecurityGroup:
      Type: AWS::EC2::SecurityGroup
      Properties:
        GroupName: "no-ingress-sg"
        GroupDescription: "Security group with no ingress rule"
        VpcId:
          Ref: VPC
    DatabaseSubnetGroup:
      Type: "AWS::RDS::DBSubnetGroup"
      Properties:
        DBSubnetGroupDescription: "DB Subnet Group for Aurora Serverless"
        SubnetIds:
          - Ref: PrivateSubnet1
          - Ref: PrivateSubnet2
```

</p>
</details>

<details>
<summary>Now the VPC and all associated services have been created you can add the configuration to call the custom Lambda function created by this service.  Add the following to the previous snippet</summary>
<p>

```yml
    AuroraServerless:
      Type: Custom::CustomResource
      Properties:
        ServiceToken: arn:aws:lambda:<Region>:<AWSAcctID>:function:serverless-aurora-dev-aurora_serverless
        DBClusterIdentifier: <ClusterName>
        DatabaseName: <DatabaseName>
        MasterUsername: <Username>
        MasterUserPassword: <Password>
        DBSubnetGroupName:
          Ref: DatabaseSubnetGroup
```

You will need to replace:
* `<Region>` with the AWS region you've deployed this service to
* `<AWSActID>` with the AWS account ID you've deployed with
* `<ClusterName>` with the name you want to give the AWS RDS Aurora database cluster
* `<DatabaseName>` with the name of the database to create on the cluster
* `<Username>` with the superuser login name
* `<Password>` with the superuser password 

</p>
</details>
