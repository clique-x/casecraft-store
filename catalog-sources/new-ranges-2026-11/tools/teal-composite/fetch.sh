#!/bin/bash
# usage: fetch.sh list.tsv outroot logfile   (list: subdir \t filename \t url)
list=$1; root=$2; log=$3
while IFS=$'\t' read -r sub name url; do
  mkdir -p "$root/$sub"
  if [ -s "$root/$sub/$name" ]; then continue; fi
  r=$(curl -sS -o "$root/$sub/$name" -w "%{http_code} %{content_type} %{size_download}" "$url" 2>&1)
  echo -e "$(date -u +%FT%TZ)\t$sub/$name\t$r\t$url" >> "$log"
  sleep 1.5
done < "$list"
echo DONE >> "$log"
