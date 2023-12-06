// WIP: type definitions for the 'dynamic config' spec
// examples of configs: https://github.com/e-mission/nrel-openpath-deploy-configs/tree/main/configs

export type AppConfig = {
  server: ServerConnConfig;
  survey_info: {
    'trip-labels': 'MULTILABEL' | 'ENKETO';
    surveys: EnketoSurveyConfig;
  };
  [k: string]: any; // TODO fill in all the other fields
};

export type ServerConnConfig = {
  connectUrl: `https://${string}`;
  aggregate_call_auth: 'no_auth' | 'user_only' | 'never';
};

export type EnketoSurveyConfig = {
  [surveyName: string]: {
    formPath: string;
    labelTemplate: { [lang: string]: string };
    labelVars: { [activity: string]: { [key: string]: string; type: string } };
    version: number;
    compatibleWith: number;
    dataKey?: string;
  };
};