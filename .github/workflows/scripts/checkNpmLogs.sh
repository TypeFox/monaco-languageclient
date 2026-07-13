#!/bin/bash

latest_log=$(ls /home/runner/.npm/_logs/*debug*.log | sort | tail -n 1)
if [ -f $latest_log ]; then
  cat $latest_log
fi
