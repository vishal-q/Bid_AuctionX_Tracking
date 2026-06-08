@echo off
SET JAVA_HOME=C:\Program Files\JetBrains\IntelliJ IDEA 2025.3.3\jbr
SET MVN=C:\Program Files\JetBrains\IntelliJ IDEA 2025.3.3\plugins\maven\lib\maven3\bin\mvn.cmd

echo Starting BidFlow Spring Boot Backend...
"%MVN%" spring-boot:run
