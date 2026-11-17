package db

import (
	"fmt"
	"os"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func requireEnv(name string) string {
	value := os.Getenv(name)
	if value == "" {
		// panic 是 Go 最接近「丟例外讓程式中斷」的機制
		panic(fmt.Sprintf("遺失必要的環境變數: %s", name))
	}
	return value
}

// 需回應的格式 user:password@tcp(host:port)/dbname?charset=utf8mb4&parseTime=True&loc=Local
func buildDSN() string {
	user := requireEnv("MYSQL_USER")
	password := requireEnv("MYSQL_PASSWORD")
	host := requireEnv("DB_HOST")
	port := requireEnv("DB_PORT")
	dbName := requireEnv("MYSQL_DATABASE")

	// 用 fmt.Sprintf 組出上面格式的字串
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local", user, password, host, port, dbName)
	return dsn
}

func NewConnection() (*gorm.DB, error) {
	dsn := buildDSN()
	gormDB, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	sqlDB, err := gormDB.DB()
	if err != nil {
		return nil, err
	}
	sqlDB.SetMaxOpenConns(10)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(time.Hour)

	return gormDB, nil
}