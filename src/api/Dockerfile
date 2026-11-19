FROM mcr.microsoft.com/dotnet/sdk:10.0.403-alpine3.24 AS build
WORKDIR /source
COPY global.json Directory.Build.props NuGet.Config ./
COPY src/api/ScrumPoker.Api.csproj src/api/packages.lock.json src/api/
RUN dotnet restore src/api/ScrumPoker.Api.csproj --locked-mode --configfile NuGet.Config
COPY src/api/ src/api/
RUN dotnet publish src/api/ScrumPoker.Api.csproj --configuration Release --no-restore --output /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0.14-alpine3.24 AS runtime
WORKDIR /app
RUN command -v wget
COPY --from=build /app/publish .
ENV ASPNETCORE_HTTP_PORTS=8080
USER $APP_UID
EXPOSE 8080
HEALTHCHECK --interval=5s --timeout=3s --start-period=10s --retries=12 \
  CMD wget -q -O - http://127.0.0.1:8080/api/health | grep -qx Healthy || exit 1
ENTRYPOINT ["dotnet", "ScrumPoker.Api.dll"]
