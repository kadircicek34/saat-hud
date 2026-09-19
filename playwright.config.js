const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({testDir:'./tests',testMatch:'**/*.spec.js',timeout:30000,workers:1,reporter:'line'});
