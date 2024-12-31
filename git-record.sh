#!/bin/bash
echo "git command history records, do not execute"
exit 1
cd yeec665.github.io/
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin git@github.com:yeec665/yeec665.github.io.git
git push -u origin main
git config --local user.name "yeec665"
git config --local user.email "365339836@qq.com"