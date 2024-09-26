FROM amazoncorretto:23

WORKDIR /app

# Install the necessary dependencies
RUN dnf update -y && \
    dnf install -y bubblewrap unzip util-linux shadow-utils && \ 
    dnf clean all

RUN useradd unprivileged

# Install bun
RUN curl -fsSL https://bun.sh/install | bash

ENV HOME=/root
ENV BUN_INSTALL=$HOME/.bun
ENV PATH=$BUN_INSTALL/bin:$PATH

# Copy the package.json and lock file to the working directory
COPY package.json bun.lockb ./

# Install javascript dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the app's source code to the working directory
COPY . .

# Build the SvelteKit app
RUN bun --bun run build

# Expose the port that the app will run on
ENV PORT=8080
EXPOSE 8080

WORKDIR /app/build

# Set the command to run the app
CMD ["bun", "--bun", "run", "start"]