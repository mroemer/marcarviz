#!/usr/bin/env bash
until npm start | tee -a tea.log ; do
    echo "Server crashed with exit code $?. Respawning.." >&2
    sleep 1
done
