#!/bin/sh
if [ -z "$1" ]
then
  echo "Which folder do you want to deploy to GitHub Pages?"
  exit 1
fi
php index.php > $1/index.html
cp -r asset/ $1/
git commit dist/ -m "deploy"
git subtree push --prefix $1 origin gh-pages
