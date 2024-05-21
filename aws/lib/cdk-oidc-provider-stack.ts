import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';


export class CdkOidcProviderStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the OIDC provider
    const oidcProvider = new iam.OpenIdConnectProvider(this, 'GitHubOIDCProvider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
    });

    // Define the IAM role for GitHub Actions
    const githubActionsRole = new iam.Role(this, 'GitHubActionsRole', {
      assumedBy: new iam.FederatedPrincipal(
        oidcProvider.openIdConnectProviderArn,
        {
          'StringEquals': { 'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com' },
          'StringLike': { 'token.actions.githubusercontent.com:sub': 'repo:tandia-pe/*:*' },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
      description: 'Service Role for use in GitHub Actions',
    });

    // Attach a policy to the role
    githubActionsRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['bedrock:InvokeModel'],
      resources: ['*'],
    }));

    // Output the ARN of the role
    new cdk.CfnOutput(this, 'GitHubActionsRoleArn', {
      value: githubActionsRole.roleArn,
      description: 'ARN of the service role for use in GitHub Actions',
    });
  }
}
